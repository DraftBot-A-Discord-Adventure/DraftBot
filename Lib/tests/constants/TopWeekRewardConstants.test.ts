import {
	describe, expect, it
} from "vitest";
import {
	TOP_WEEK_REWARD_TIERS, TopWeekRewardConstants
} from "../../src/constants/TopWeekRewardConstants";

describe("TopWeekRewardConstants", () => {
	describe("getTier", () => {
		it("grants nothing below the lowest threshold", () => {
			expect(TopWeekRewardConstants.getTier(0)).toBeNull();
			expect(TopWeekRewardConstants.getTier(TopWeekRewardConstants.MIN_REWARDED_WEEKLY_SCORE - 1)).toBeNull();
		});

		it("grants the bronze tier exactly at the lowest threshold", () => {
			expect(TopWeekRewardConstants.getTier(TopWeekRewardConstants.MIN_REWARDED_WEEKLY_SCORE)?.id).toBe(TOP_WEEK_REWARD_TIERS.BRONZE);
		});

		it("grants only the highest reached tier", () => {
			expect(TopWeekRewardConstants.getTier(7_499)?.id).toBe(TOP_WEEK_REWARD_TIERS.BRONZE);
			expect(TopWeekRewardConstants.getTier(7_500)?.id).toBe(TOP_WEEK_REWARD_TIERS.SILVER);
			expect(TopWeekRewardConstants.getTier(15_000)?.id).toBe(TOP_WEEK_REWARD_TIERS.GOLD);
			expect(TopWeekRewardConstants.getTier(25_000)?.id).toBe(TOP_WEEK_REWARD_TIERS.DIAMOND);
			expect(TopWeekRewardConstants.getTier(1_000_000)?.id).toBe(TOP_WEEK_REWARD_TIERS.DIAMOND);
		});
	});

	describe("TIERS", () => {
		it("defines exactly one tier per tier id", () => {
			expect(TopWeekRewardConstants.TIERS.map(tier => tier.id)
				.sort()).toEqual(Object.values(TOP_WEEK_REWARD_TIERS)
				.sort());
		});

		it("gives strictly more money and at least as many gems to each higher tier", () => {
			const ascending = [...TopWeekRewardConstants.TIERS].reverse();
			for (let i = 1; i < ascending.length; i++) {
				expect(ascending[i].minWeeklyScore).toBeGreaterThan(ascending[i - 1].minWeeklyScore);
				expect(ascending[i].money).toBeGreaterThan(ascending[i - 1].money);
				expect(ascending[i].gems).toBeGreaterThanOrEqual(ascending[i - 1].gems);
			}
		});
	});

	it("starts every tier counter at zero", () => {
		expect(TopWeekRewardConstants.emptyRewardedPlayersPerTier()).toEqual({
			[TOP_WEEK_REWARD_TIERS.BRONZE]: 0,
			[TOP_WEEK_REWARD_TIERS.SILVER]: 0,
			[TOP_WEEK_REWARD_TIERS.GOLD]: 0,
			[TOP_WEEK_REWARD_TIERS.DIAMOND]: 0
		});
	});
});
