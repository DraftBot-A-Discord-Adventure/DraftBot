import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {generateRandomItem, getItemValue, giveItemToPlayer} from "../utils/ItemUtils";
import {Constants} from "../Constants";
import {BlockingUtils} from "../utils/BlockingUtils";
import {RandomUtils} from "../utils/RandomUtils";
import {TranslationModule, Translations} from "../Translations";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {sendErrorMessage} from "../utils/ErrorUtils";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {BlockingConstants} from "../constants/BlockingConstants";
import {NumberChangeReason} from "../database/logs/LogsDatabase";
import Player from "../database/game/models/Player";
import {InventorySlots} from "../database/game/models/InventorySlot";

/**
 * Get the callback of the shop small event
 * @param player
 * @param price
 * @param interaction
 * @param language
 * @param translationShop
 * @param randomItem
 */
function callbackShopSmallEvent(
	player: Player,
	price: number,
	interaction: CommandInteraction,
	language: string,
	translationShop: TranslationModule,
	randomItem: GenericItemModel): (msg: DraftBotValidateReactionMessage) => Promise<void> {
	return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.MERCHANT);
		if (msg.isValidated()) {
			if (player.money < price) {
				await sendErrorMessage(interaction.user, interaction, language,
					translationShop.format("error.cannotBuy", {
						missingMoney: price - player.money
					})
				);
				return;
			}
			await giveItemToPlayer(player, randomItem, language, interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id), Constants.SMALL_EVENT.SHOP_RESALE_MULTIPLIER, 1);
			await player.addMoney({
				amount: -price,
				channel: interaction.channel,
				language,
				reason: NumberChangeReason.SMALL_EVENT
			});
			await player.save();
			return;
		}
		await sendErrorMessage(interaction.user, interaction, language,
			Translations.getModule("commands.shop", language).get("error.canceledPurchase"), true
		);
	};
}

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Find a merchant who sells you a random item at a cheap price (or is it)
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const randomItem = await generateRandomItem(Constants.RARITY.SPECIAL);
		const multiplier = RandomUtils.randInt(1, 11) === 10 ? 5 : 0.6;
		const price = Math.round(getItemValue(randomItem) * multiplier);
		const gender = RandomUtils.draftbotRandom.pick([0, 1]);
		const translationShop = Translations.getModule("smallEvents.shop", language);
		const endCallback = callbackShopSmallEvent(player, price, interaction, language, Translations.getModule("commands.shop", language), randomItem);
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
					translationShop.getRandom(`intro.${gender}`)
					+ translationShop.get("end"), {
						name: translationShop.getRandom(`names.${gender}`),
						item: randomItem.toString(language, null),
						price: price,
						type: `${Constants.REACTIONS.ITEM_CATEGORIES[randomItem.getCategory()]} ${translationShop.get(`types.${randomItem.getCategory()}`)}`
					}))
			.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.MERCHANT, collector));
	}
};