import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";
import {Translations} from "../Translations";
import {format} from "../utils/StringFormatter";

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnBoat(player));
	},

	/**
	 * Execute small event
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.boatAdvice", language);
		seEmbed.setDescription(
			`${seEmbed.data.description}${format(
				tr.getRandom("intro"), {
					advice: format(tr.getRandom("advices"), {})
				})}`
		);
		await interaction.editReply({ embeds: [seEmbed] });
	}
};