import { KingChallengeReward } from "../types/KingChallenge";

/**
 * The king's challenge: every week, players cross tiers with the score they gain and are rewarded at each crossed tier.
 *
 * The first threshold is fixed, the last one follows the best weekly scores of the previous weeks, and the tiers in between
 * are spaced geometrically: each tier asks for the same ratio of points over the previous one, so the gaps feel even, the
 * lower tiers barely move and the upper ones follow the evolution of the scores. On the logged 2026 weeks, ~78 % of the
 * active players reached the first tier, the median one reached 4 tiers and a tier was crossed every ~1.2 to 1.5 active day.
 */
export abstract class KingChallengeConstants {
	/**
	 * A player coming back after a day or more gains ~1 100 points (2 000 at most) with their first report:
	 * the first tier asks for a second session instead of being given away
	 */
	static readonly FIRST_TIER_SCORE = 2_000;

	/** The last threshold is this multiplier applied to the averaged reference score */
	static readonly LAST_TIER_REFERENCE_MULTIPLIER = 1.3;

	/** Rank of the weekly score used as reference: the first ones are too noisy (48k to 86k for the first, 29k to 39k for the fifth) */
	static readonly REFERENCE_RANK = 5;

	/** Number of past weeks averaged to smooth the reference score */
	static readonly REFERENCE_WEEKS = 4;

	/** The last threshold never goes below this value, even if the best players are less active */
	static readonly MIN_LAST_TIER_SCORE = 30_000;

	/** Fifth best weekly scores of the four weeks before the release, used until enough weeks are recorded */
	static readonly DEFAULT_REFERENCE_SCORES: readonly number[] = [
		30_890,
		31_358,
		28_827,
		29_155
	];

	static readonly THRESHOLD_ROUNDING = 100;

	/**
	 * Reward of each tier, granted once per week when the tier is crossed.
	 * Tokens are the main reward: the most active players lack them, they are credited even above the token cap
	 */
	static readonly REWARDS: readonly KingChallengeReward[] = [
		{
			money: 750, tokens: 2, gems: 0
		},
		{
			money: 1_250, tokens: 2, gems: 0
		},
		{
			money: 1_750, tokens: 3, gems: 1
		},
		{
			money: 2_500, tokens: 3, gems: 1
		},
		{
			money: 3_250, tokens: 4, gems: 1
		},
		{
			money: 4_250, tokens: 5, gems: 2
		},
		{
			money: 5_500, tokens: 6, gems: 2
		}
	];

	static readonly TIER_COUNT = KingChallengeConstants.REWARDS.length;

	/**
	 * Compute the thresholds of the week from the reference scores of the previous weeks
	 * @param referenceScores
	 */
	static computeThresholds(referenceScores: readonly number[]): number[] {
		const scores = referenceScores.length > 0 ? referenceScores : KingChallengeConstants.DEFAULT_REFERENCE_SCORES;
		const averageReference = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		const lastThreshold = Math.max(
			KingChallengeConstants.MIN_LAST_TIER_SCORE,
			averageReference * KingChallengeConstants.LAST_TIER_REFERENCE_MULTIPLIER
		);
		const ratio = lastThreshold / KingChallengeConstants.FIRST_TIER_SCORE;
		const lastIndex = KingChallengeConstants.TIER_COUNT - 1;
		return Array.from({ length: KingChallengeConstants.TIER_COUNT }, (_, index) => {
			const threshold = KingChallengeConstants.FIRST_TIER_SCORE * ratio ** (index / lastIndex);
			return Math.round(threshold / KingChallengeConstants.THRESHOLD_ROUNDING) * KingChallengeConstants.THRESHOLD_ROUNDING;
		});
	}

	/**
	 * Add a weekly reference score to the history, keeping only the last weeks used for the smoothing
	 * @param referenceScores
	 * @param newReferenceScore
	 */
	static pushReferenceScore(referenceScores: readonly number[], newReferenceScore: number): number[] {
		return [...referenceScores, newReferenceScore].slice(-KingChallengeConstants.REFERENCE_WEEKS);
	}

	/**
	 * Number of tiers reached with the given weekly score
	 * @param weeklyScore
	 * @param thresholds
	 */
	static getReachedTier(weeklyScore: number, thresholds: readonly number[]): number {
		return thresholds.filter(threshold => weeklyScore >= threshold).length;
	}

	/**
	 * Sum of the rewards of the tiers after `fromTier` up to `toTier` included
	 * @param fromTier Number of tiers already rewarded
	 * @param toTier Number of tiers now reached
	 */
	static sumRewards(fromTier: number, toTier: number): KingChallengeReward {
		return KingChallengeConstants.REWARDS.slice(fromTier, toTier)
			.reduce((total, reward) => ({
				money: total.money + reward.money,
				tokens: total.tokens + reward.tokens,
				gems: total.gems + reward.gems
			}), {
				money: 0, tokens: 0, gems: 0
			});
	}
}
