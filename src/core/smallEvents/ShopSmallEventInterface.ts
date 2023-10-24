import {SmallEvent} from "./SmallEvent";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {TranslationModule, Translations} from "../Translations";
import Player from "../database/game/models/Player";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Maps} from "../maps/Maps";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {format} from "../utils/StringFormatter";
import {Constants} from "../Constants";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {getItemValue, giveItemToPlayer} from "../utils/ItemUtils";
import {sendErrorMessage} from "../utils/ErrorUtils";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {NumberChangeReason} from "../constants/LogsConstants";
import {RandomUtils} from "../utils/RandomUtils";

export abstract class ShopSmallEvent implements SmallEvent {
	protected shopTranslation: TranslationModule;

	protected multiplier: number;

	abstract initiateTranslationModule(language: string): void;

	abstract getRandomItem(): Promise<GenericItemModel>;

	abstract initiatePriceMultiplier(player: Player): void | Promise<void>;

	abstract getIntroKey(gender: number): string;

	abstract getVendorNameKey(gender: number): string;

	abstract getTip(): string;

	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	}

	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		this.initiateTranslationModule(language);
		await this.initiatePriceMultiplier(player);
		const randomItem = await this.getRandomItem();
		const price = Math.round(getItemValue(randomItem) * this.multiplier);
		const endCallback = this.callbackShopSmallEvent(player, price, interaction, randomItem);
		const gender = RandomUtils.draftbotRandom.pick([0, 1]);
		await new DraftBotValidateReactionMessage(
			interaction.user,
			endCallback
		)
			.setAuthor({
				name: seEmbed.data.author.name,
				iconURL: interaction.user.displayAvatarURL()
			})
			.setDescription(seEmbed.data.description
				+ format(
					this.shopTranslation.getRandom(this.getIntroKey(gender))
					+ this.getTip()
					+ this.shopTranslation.get("end"), {
						name: this.shopTranslation.getRandom(this.getVendorNameKey(gender)),
						item: randomItem.toString(language, null),
						price,
						type: `${Constants.REACTIONS.ITEM_CATEGORIES[randomItem.getCategory()]} ${this.shopTranslation.get(`types.${randomItem.getCategory()}`)}`
					}))
			.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.MERCHANT, collector));
	}

	private callbackShopSmallEvent(player: Player, price: number, interaction: CommandInteraction, randomItem: GenericItemModel): (msg: DraftBotValidateReactionMessage) => Promise<void> {
		const shopTranslationModule = Translations.getModule("commands.shop", this.shopTranslation.language);
		return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
			BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.MERCHANT);
			if (!msg.isValidated()) {
				await sendErrorMessage(interaction.user, interaction, this.shopTranslation.language,
					shopTranslationModule.get("error.canceledPurchase"), true
				);
				return;
			}
			if (player.money < price) {
				await sendErrorMessage(interaction.user, interaction, this.shopTranslation.language,
					shopTranslationModule.format("error.cannotBuy", {
						missingMoney: price - player.money
					})
				);
				return;
			}
			await giveItemToPlayer(player, randomItem, this.shopTranslation.language,
				interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id), SmallEventConstants.SHOP.RESALE_MULTIPLIER);
			await player.spendMoney({
				amount: price,
				channel: interaction.channel,
				language: this.shopTranslation.language,
				reason: NumberChangeReason.SMALL_EVENT
			});
			await player.save();
		};
	}
}