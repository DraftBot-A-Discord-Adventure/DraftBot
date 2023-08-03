import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../Translations";
import Player from "../database/game/models/Player";
import League from "../database/game/models/League";
import {getNextSaturdayMidnight, printTimeBeforeDate, todayIsSunday} from "../utils/TimeUtils";
import {FightConstants} from "../constants/FightConstants";
import {Maps} from "../maps/Maps";

/**
 * Load the description of the reward the player will have
 * @param leagueRewardTranslationModule
 * @param league
 */
function rewardListToString(leagueRewardTranslationModule: TranslationModule, league: League): string {
	return leagueRewardTranslationModule.format("reward", {
		money: league.getMoneyToAward(),
		xp: league.getXPToAward()
	});
}

/**
 * Load the description of the ligue reward small event
 * @param leagueRewardTranslationModule
 * @param player
 * @param language
 */
async function generateEndMessage(leagueRewardTranslationModule: TranslationModule, player: Player, language: string) : Promise<string> {

	if (todayIsSunday()) {
		return leagueRewardTranslationModule.format("sunday", {});
	}

	const league = await player.getLeague();
	const rewards = rewardListToString(leagueRewardTranslationModule, league);

	return leagueRewardTranslationModule.format(
		player.fightCountdown > FightConstants.FIGHT_COUNTDOWN_MAXIMAL_VALUE ? "notEnoughFight" : "endMessage",
		{
			league: league.toString(language),
			rewards,
			time: printTimeBeforeDate(getNextSaturdayMidnight())
		});
}

export const smallEvent: SmallEvent = {
	/**
	 * Must be on continent
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player) && player.level > FightConstants.REQUIRED_LEVEL);
	},

	/**
	 * Gives a reward depending on your current class
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {

		const leagueRewardTranslationModule = Translations.getModule("smallEvents.leagueReward", language);
		const message = await generateEndMessage(leagueRewardTranslationModule, player, language);

		seEmbed.setDescription(
			seEmbed.data.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			leagueRewardTranslationModule.getRandom("intrigue") +
			message
		);
		await interaction.editReply({embeds: [seEmbed]});
	}
};