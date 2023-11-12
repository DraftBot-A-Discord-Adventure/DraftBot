import {SmallEvent} from "./SmallEvent";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {SmallEventConstants} from "../constants/SmallEventConstants";
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
	 * Find a random item that have a rarity of epic or less
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const randomItem = await generateRandomItem(null, ItemConstants.RARITY.COMMON, SmallEventConstants.FIND_ITEM.MAXIMUM_RARITY);
		seEmbed.setDescription(
			seEmbed.data.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			Translations.getModule("smallEvents.findItem", language).getRandom("intrigue")
		);

		await interaction.editReply({embeds: [seEmbed]});
		await giveItemToPlayer(player, randomItem, language, interaction.user, interaction.channel, await InventorySlots.getOfPlayer(player.id));
	}
};