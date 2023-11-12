import {SmallEvent} from "./SmallEvent";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {Translations} from "../Translations";
import {NumberChangeReason} from "../constants/LogsConstants";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";

export const smallEvent: SmallEvent = {

	/**
	 * You must not be full of health to execute this small event
	 * @param player
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	},

	/**
	 * Heal the player with a random amount of life
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const healthWon = RandomUtils.rangedInt(SmallEventConstants.HEALTH);
		const translationWH = Translations.getModule("smallEvents.winHealth", language);
		seEmbed.setDescription(
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			format(translationWH.getRandom("intrigue"), {
				health: healthWon
			})
		);
		await player.addHealth(healthWon, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
		await player.save();
		await interaction.editReply({embeds: [seEmbed]});
	}
};