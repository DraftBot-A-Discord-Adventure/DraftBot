import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {generateRandomItem, giveItemToPlayer} from "../utils/ItemUtils";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import Player from "../database/game/models/Player";
import {InventorySlots} from "../database/game/models/InventorySlot";
import {ItemConstants} from "../constants/ItemConstants";
import {LanguageType} from "../constants/TypeConstants";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Find a random item that have a rarity of epic or less
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: LanguageType, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
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