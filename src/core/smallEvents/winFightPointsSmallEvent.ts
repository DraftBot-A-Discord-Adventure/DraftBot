import {SmallEvent} from "./SmallEvent";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {PVEConstants} from "../constants/PVEConstants";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(
			Maps.isOnPveIsland(player) &&
			player.fightPointsLost > 0
		);
	},

	/**
	 * Execute small event
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.winFightPoints", language);
		const maxFightPoints = await player.getMaxCumulativeFightPoint();
		let amount = RandomUtils.randInt(
			PVEConstants.FIGHT_POINTS_SMALL_EVENT.MIN_PERCENT * maxFightPoints,
			PVEConstants.FIGHT_POINTS_SMALL_EVENT.MAX_PERCENT * maxFightPoints
		);
		if (amount === 0) {
			amount = 1;
		}

		await player.addFightPoints(amount, maxFightPoints);
		await player.save();

		seEmbed.setDescription(
			seEmbed.data.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			format(tr.getRandom("stories"), {
				fightPoints: amount
			})
		);
		await interaction.editReply({embeds: [seEmbed]});

		await player.leavePVEIslandIfNoFightPoints(interaction, language);
	}
};