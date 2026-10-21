/**
 * What a player receives when crossing one or several tiers of the king's challenge
 */
export type KingChallengeReward = {
	money: number;
	tokens: number;
	gems: number;
};

/**
 * Progress of a player in the king's challenge of the current week
 */
export type KingChallengeProgress = {
	weeklyScore: number;

	/** Number of tiers reached this week, between 0 and the tier count */
	tier: number;

	/** Weekly score required by each tier, in increasing order */
	thresholds: number[];

	/** Date (in ms) at which the challenge resets */
	nextResetDate: number;
};

/**
 * Summary of the finished week announced on Monday
 */
export type KingChallengeWeekSummary = {

	/** Players who reached at least the first tier */
	rewardedPlayers: number;

	/** Players who reached the last tier */
	completedPlayers: number;
};
