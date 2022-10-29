import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {NumberChangeReason} from "../constants/LogsConstants";
import {TravelTime} from "../maps/TravelTime";
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
	 * Advance the time of the player
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const timeAdvanced = RandomUtils.draftbotRandom.integer(10, 50);

		await TravelTime.timeTravel(player, timeAdvanced, NumberChangeReason.SMALL_EVENT);
		await player.save();

		seEmbed.setDescription(
			seEmbed.data.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			format(Translations.getModule("smallEvents.advanceTime", language).getRandom("stories"), {
				time: timeAdvanced
			})
		);

		await interaction.editReply({embeds: [seEmbed]});
	}
};