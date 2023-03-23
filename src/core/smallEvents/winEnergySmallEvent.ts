import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {format} from "../utils/StringFormatter";
import {Translations} from "../Translations";
import {NumberChangeReason} from "../constants/LogsConstants";
import Player from "../database/game/models/Player";
import {MapConstants} from "../constants/MapConstants";

export const smallEvent: SmallEvent = {

	/**
	 * You must be near claire de ville and not be full of energy to execute this small event
	 * @param player
	 */
	async canBeExecuted(player: Player): Promise<boolean> {
		const destinationId = await player.getDestinationId();
		const originId = await player.getPreviousMapId();
		return player.fightPointsLost > 0 && destinationId === MapConstants.LOCATIONS_IDS.CLAIRE_DE_VILLE || originId === MapConstants.LOCATIONS_IDS.CLAIRE_DE_VILLE;
	},

	/**
	 * Heal the player with a random amount of life
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const translationWH = Translations.getModule("smallEvents.winEnergy", language);
		seEmbed.setDescription(
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			format(translationWH.getRandom("intrigue"),
				{}
			)
		);
		player.addEnergy(9999999, NumberChangeReason.SMALL_EVENT);
		await player.save();
		await interaction.editReply({embeds: [seEmbed]});
	}
};