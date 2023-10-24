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

	protected itemMultiplier: number;

	protected randomItem: GenericItemModel;

	protected itemPrice: number;

	abstract getTranslationModuleKey(): string;

	abstract getRandomItem(): Promise<GenericItemModel>;

	abstract getPriceMultiplier(player: Player): number | Promise<number>;

	abstract getIntroKey(gender: number): string;

	abstract getVendorNameKey(gender: number): string;

	abstract getTip(): string;

	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	}

	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		this.shopTranslation = Translations.getModule(`smallEvents.${this.getTranslationModuleKey()}`, language);
		this.itemMultiplier = await this.getPriceMultiplier(player);
		this.randomItem = await this.getRandomItem();
		this.itemPrice = Math.round(getItemValue(this.randomItem) * this.itemMultiplier);
		const endCallback = this.callbackShopSmallEvent(player, interaction);
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
						item: this.randomItem.toString(language, null),
						price: this.itemPrice,
						type: `${Constants.REACTIONS.ITEM_CATEGORIES[this.randomItem.getCategory()]} ${this.shopTranslation.get(`types.${this.randomItem.getCategory()}`)}`
					}))
			.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.MERCHANT, collector));
	}

	private callbackShopSmallEvent(player: Player, interaction: CommandInteraction): (msg: DraftBotValidateReactionMessage) => Promise<void> {
		const shopTranslationModule = Translations.getModule("commands.shop", this.shopTranslation.language);
		return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
			BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.MERCHANT);
			if (!msg.isValidated()) {
				await sendErrorMessage(interaction.user, interaction, this.shopTranslation.language,
					shopTranslationModule.get("error.canceledPurchase"), true
				);
				return;
			}
			if (player.money < this.itemPrice) {
				await sendErrorMessage(interaction.user, interaction, this.shopTranslation.language,
					shopTranslationModule.format("error.cannotBuy", {
						missingMoney: this.itemPrice - player.money
					})
				);
				return;
			}
			await giveItemToPlayer(player, this.randomItem, this.shopTranslation.language,
				interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id), SmallEventConstants.SHOP.RESALE_MULTIPLIER);
			await player.spendMoney({
				amount: this.itemPrice,
				channel: interaction.channel,
				language: this.shopTranslation.language,
				reason: NumberChangeReason.SMALL_EVENT
			});
			await player.save();
		};
	}
}