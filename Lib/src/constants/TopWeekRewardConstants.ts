import { LeagueInfoConstants } from "./LeagueInfoConstants";

export type TopWeekRewardTier = {
	leagueId: number;
	minWeeklyScore: number;
	money: number;
	gems: number;
};

/**
 * Number of rewarded players, indexed by league id
 */
export type TopWeekRewardedPlayersPerLeague = number[];

/**
 * Rewards granted to every player at the end of the top week. The tiers follow the leagues ladder (indexed by league id),
 * so a player ends the week in the "week league" matching the score they gained.
 *
 * Thresholds are calibrated on the weekly scores logged in 2026: every league holds between 12 and 25 players per week,
 * except the last two ones (~4 and ~2 players), which give the most active players a goal too. The money is worth ~30 to
 * ~45 % of the weekly income of the lower and middle leagues, down to ~12 % for the highest ones.
 */
export abstract class TopWeekRewardConstants {
	static readonly MIN_WEEKLY_SCORE = [
		500, // Wood
		1_500, // Rock
		3_000, // Iron
		5_000, // Bronze
		7_500, // Silver
		10_000, // Gold
		13_500, // Diamond
		17_500, // Elite
		22_500, // Infinite
		30_000, // Legendary
		45_000 // Royal
	];

	static readonly MONEY = [
		750, // Wood
		1_000, // Rock
		1_500, // Iron
		2_000, // Bronze
		2_500, // Silver
		3_000, // Gold
		4_000, // Diamond
		5_000, // Elite
		6_000, // Infinite
		7_000, // Legendary
		8_000 // Royal
	];

	static readonly GEMS = [
		0, // Wood
		0, // Rock
		1, // Iron
		1, // Bronze
		1, // Silver
		2, // Gold
		2, // Diamond
		3, // Elite
		3, // Infinite
		4, // Legendary
		5 // Royal
	];

	static readonly MIN_REWARDED_WEEKLY_SCORE = TopWeekRewardConstants.MIN_WEEKLY_SCORE[0];

	/**
	 * Get the highest tier reached with the given weekly score, or null if no tier is reached
	 * @param weeklyScore
	 */
	static getTier(weeklyScore: number): TopWeekRewardTier | null {
		for (let leagueId = LeagueInfoConstants.ROYAL_LEAGUE_ID; leagueId >= 0; leagueId--) {
			if (weeklyScore >= TopWeekRewardConstants.MIN_WEEKLY_SCORE[leagueId]) {
				return {
					leagueId,
					minWeeklyScore: TopWeekRewardConstants.MIN_WEEKLY_SCORE[leagueId],
					money: TopWeekRewardConstants.MONEY[leagueId],
					gems: TopWeekRewardConstants.GEMS[leagueId]
				};
			}
		}
		return null;
	}

	/**
	 * Build a per-league counter initialized to zero
	 */
	static emptyRewardedPlayersPerLeague(): TopWeekRewardedPlayersPerLeague {
		return TopWeekRewardConstants.MIN_WEEKLY_SCORE.map(() => 0);
	}
}
