import Player from "../database/game/models/Player";
import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../Translations";
import {GenericItemModel} from "../database/game/models/GenericItemModel";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {BlockingUtils} from "./BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {sendErrorMessage} from "./ErrorUtils";
import {giveItemToPlayer} from "./ItemUtils";
import {NumberChangeReason} from "../constants/LogsConstants";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {SmallEventConstants} from "../constants/SmallEventConstants";

/**
 * Get the callback of the shop small event
 * @param player
 * @param price
 * @param interaction
 * @param translationShop
 * @param randomItem
 */
export function callbackShopSmallEvent(
	player: Player,
	price: number,
	interaction: CommandInteraction,
	translationShop: TranslationModule,
	randomItem: GenericItemModel): (msg: DraftBotValidateReactionMessage) => Promise<void> {
	return async (msg: DraftBotValidateReactionMessage): Promise<void> => {
		BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.MERCHANT);
		if (msg.isValidated()) {
			if (player.money < price) {
				await sendErrorMessage(interaction.user, interaction, translationShop.language,
					translationShop.format("error.cannotBuy", {
						missingMoney: price - player.money
					})
				);
				return;
			}
			await giveItemToPlayer(player, randomItem, translationShop.language,
				interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id), SmallEventConstants.SHOP.RESALE_MULTIPLIER);
			await player.spendMoney({
				amount: price,
				channel: interaction.channel,
				language: translationShop.language,
				reason: NumberChangeReason.SMALL_EVENT
			});
			await player.save();
			return;
		}
		await sendErrorMessage(interaction.user, interaction, translationShop.language,
			Translations.getModule("commands.shop", translationShop.language).get("error.canceledPurchase"), true
		);
	};
}