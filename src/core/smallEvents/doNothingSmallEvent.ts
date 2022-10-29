import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {Data} from "../Data";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(!Maps.isOnPveMap(player));
	},

	/**
	 * Do literally nothing, just shows the player he is doing its way
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		seEmbed.setDescription(
			Data.getModule("smallEvents.doNothing").getString("emote") +
			Translations.getModule("smallEvents.doNothing", language).getRandom("stories"));
		await interaction.editReply({embeds: [seEmbed]});
	}
};