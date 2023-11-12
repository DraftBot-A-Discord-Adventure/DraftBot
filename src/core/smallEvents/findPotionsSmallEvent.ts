import {SmallEvent} from "./SmallEvent";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import Player from "../database/game/models/Player";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {ItemConstants} from "../constants/ItemConstants";
import {Maps} from "../maps/Maps";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	},

	/**
	 * Find a new potion
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const randomItem = await generateRandomItem(ItemConstants.CATEGORIES.POTION, ItemConstants.RARITY.COMMON, ItemConstants.RARITY.MYTHICAL);
		seEmbed.setDescription(
			seEmbed.data.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			Translations.getModule("smallEvents.findPotions", language).getRandom("intrigue")
		);

		await interaction.editReply({embeds: [seEmbed]});
		await giveItemToPlayer(player, randomItem, language, interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id));
	}
};