export const TOP_WEEK_REWARD_TIERS = {
	BRONZE: "bronze",
	SILVER: "silver",
	GOLD: "gold",
	DIAMOND: "diamond"
} as const;

export type TopWeekRewardTierId = typeof TOP_WEEK_REWARD_TIERS[keyof typeof TOP_WEEK_REWARD_TIERS];

export type TopWeekRewardTier = {
	id: TopWeekRewardTierId;
	minWeeklyScore: number;
	money: number;
	gems: number;
};

export type TopWeekRewardedPlayersPerTier = Record<TopWeekRewardTierId, number>;

/**
 * Rewards granted to every player at the end of the top week, depending on the weekly score they reached.
 *
 * Thresholds are calibrated on the weekly scores logged in 2026 (Bronze ≈ 75 % of the active players,
 * Silver ≈ 50 %, Gold ≈ 25 %, Diamond ≈ 7 %), and the money is worth ~40 % of the weekly income
 * of a Bronze player down to ~20 % for a Diamond one, so the reward mostly matters to casual players.
 */
export abstract class TopWeekRewardConstants {
	/**
	 * Sorted by decreasing threshold: only the highest reached tier is granted
	 */
	static readonly TIERS: readonly TopWeekRewardTier[] = [
		{
			id: TOP_WEEK_REWARD_TIERS.DIAMOND,
			minWeeklyScore: 25_000,
			money: 8_000,
			gems: 5
		},
		{
			id: TOP_WEEK_REWARD_TIERS.GOLD,
			minWeeklyScore: 15_000,
			money: 5_000,
			gems: 3
		},
		{
			id: TOP_WEEK_REWARD_TIERS.SILVER,
			minWeeklyScore: 7_500,
			money: 3_000,
			gems: 2
		},
		{
			id: TOP_WEEK_REWARD_TIERS.BRONZE,
			minWeeklyScore: 2_500,
			money: 1_500,
			gems: 1
		}
	];

	static readonly MIN_REWARDED_WEEKLY_SCORE = TopWeekRewardConstants.TIERS[TopWeekRewardConstants.TIERS.length - 1].minWeeklyScore;

	/**
	 * Get the highest tier reached with the given weekly score, or null if no tier is reached
	 * @param weeklyScore
	 */
	static getTier(weeklyScore: number): TopWeekRewardTier | null {
		return TopWeekRewardConstants.TIERS.find(tier => weeklyScore >= tier.minWeeklyScore) ?? null;
	}

	/**
	 * Build a per-tier counter initialized to zero
	 */
	static emptyRewardedPlayersPerTier(): TopWeekRewardedPlayersPerTier {
		return {
			[TOP_WEEK_REWARD_TIERS.BRONZE]: 0,
			[TOP_WEEK_REWARD_TIERS.SILVER]: 0,
			[TOP_WEEK_REWARD_TIERS.GOLD]: 0,
			[TOP_WEEK_REWARD_TIERS.DIAMOND]: 0
		};
	}
}
