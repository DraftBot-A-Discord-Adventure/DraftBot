import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {Data} from "../Data";
import Player from "../database/game/models/Player";

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
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