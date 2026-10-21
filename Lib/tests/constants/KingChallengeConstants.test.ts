import {
	describe, expect, it
} from "vitest";
import { KingChallengeConstants } from "../../src/constants/KingChallengeConstants";

const DEFAULT_THRESHOLDS = KingChallengeConstants.computeThresholds(KingChallengeConstants.DEFAULT_REFERENCE_SCORES);

describe("KingChallengeConstants", () => {
	describe("computeThresholds", () => {
		it("keeps the first threshold fixed and sets the last one from the averaged reference score", () => {
			const thresholds = KingChallengeConstants.computeThresholds([30_000, 40_000]);
			expect(thresholds).toHaveLength(KingChallengeConstants.TIER_COUNT);
			expect(thresholds[0]).toBe(KingChallengeConstants.FIRST_TIER_SCORE);
			expect(thresholds[thresholds.length - 1]).toBe(35_000 * KingChallengeConstants.LAST_TIER_REFERENCE_MULTIPLIER);
		});

		it("spaces the tiers geometrically, rounded to the hundred", () => {
			expect(KingChallengeConstants.computeThresholds([30_000])).toEqual([2_000, 3_300, 5_400, 8_800, 14_500, 23_800, 39_000]);
		});

		it("moves the upper tiers much more than the lower ones when the reference changes", () => {
			const low = KingChallengeConstants.computeThresholds([30_000]);
			const high = KingChallengeConstants.computeThresholds([40_000]);
			const relativeMoves = low.map((threshold, index) => high[index] / threshold);
			for (let index = 1; index < relativeMoves.length; index++) {
				expect(relativeMoves[index]).toBeGreaterThanOrEqual(relativeMoves[index - 1]);
			}
			expect(relativeMoves[0]).toBe(1);
		});

		it("never lowers the last threshold below its floor", () => {
			const thresholds = KingChallengeConstants.computeThresholds([1_000]);
			expect(thresholds[thresholds.length - 1]).toBe(KingChallengeConstants.MIN_LAST_TIER_SCORE);
		});

		it("falls back to the default reference scores without history", () => {
			expect(KingChallengeConstants.computeThresholds([])).toEqual(DEFAULT_THRESHOLDS);
		});
	});

	it("only keeps the reference scores of the last weeks", () => {
		expect(KingChallengeConstants.pushReferenceScore([1, 2, 3, 4], 5)).toEqual([2, 3, 4, 5]);
		expect(KingChallengeConstants.pushReferenceScore([1], 2)).toEqual([1, 2]);
	});

	describe("getReachedTier", () => {
		it("counts the thresholds reached", () => {
			expect(KingChallengeConstants.getReachedTier(0, DEFAULT_THRESHOLDS)).toBe(0);
			expect(KingChallengeConstants.getReachedTier(DEFAULT_THRESHOLDS[0] - 1, DEFAULT_THRESHOLDS)).toBe(0);
			expect(KingChallengeConstants.getReachedTier(DEFAULT_THRESHOLDS[0], DEFAULT_THRESHOLDS)).toBe(1);
			expect(KingChallengeConstants.getReachedTier(DEFAULT_THRESHOLDS[3], DEFAULT_THRESHOLDS)).toBe(4);
			expect(KingChallengeConstants.getReachedTier(10_000_000, DEFAULT_THRESHOLDS)).toBe(KingChallengeConstants.TIER_COUNT);
		});
	});

	describe("sumRewards", () => {
		it("adds the rewards of the crossed tiers only", () => {
			const [first, second, third] = KingChallengeConstants.REWARDS;
			expect(KingChallengeConstants.sumRewards(1, 3)).toEqual({
				money: second.money + third.money,
				tokens: second.tokens + third.tokens,
				gems: second.gems + third.gems
			});
			expect(KingChallengeConstants.sumRewards(0, 1)).toEqual(first);
			expect(KingChallengeConstants.sumRewards(2, 2)).toEqual({
				money: 0, tokens: 0, gems: 0
			});
		});
	});

	it("never gives less to a higher tier", () => {
		const rewards = KingChallengeConstants.REWARDS;
		for (let index = 1; index < rewards.length; index++) {
			expect(rewards[index].money).toBeGreaterThan(rewards[index - 1].money);
			expect(rewards[index].tokens).toBeGreaterThanOrEqual(rewards[index - 1].tokens);
			expect(rewards[index].gems).toBeGreaterThanOrEqual(rewards[index - 1].gems);
		}
	});
});
