import {
	describe, expect, it
} from "vitest";
import { TopWeekRewardConstants } from "../../src/constants/TopWeekRewardConstants";
import { LeagueInfoConstants } from "../../src/constants/LeagueInfoConstants";

const LEAGUES_COUNT = LeagueInfoConstants.ROYAL_LEAGUE_ID + 1;

describe("TopWeekRewardConstants", () => {
	describe("getTier", () => {
		it("grants nothing below the lowest threshold", () => {
			expect(TopWeekRewardConstants.getTier(0)).toBeNull();
			expect(TopWeekRewardConstants.getTier(TopWeekRewardConstants.MIN_REWARDED_WEEKLY_SCORE - 1)).toBeNull();
		});

		it("grants the league whose threshold is exactly reached, with its rewards", () => {
			for (let leagueId = 0; leagueId < LEAGUES_COUNT; leagueId++) {
				expect(TopWeekRewardConstants.getTier(TopWeekRewardConstants.MIN_WEEKLY_SCORE[leagueId])).toEqual({
					leagueId,
					minWeeklyScore: TopWeekRewardConstants.MIN_WEEKLY_SCORE[leagueId],
					money: TopWeekRewardConstants.MONEY[leagueId],
					gems: TopWeekRewardConstants.GEMS[leagueId]
				});
			}
		});

		it("stays in the lower league one point below the next threshold", () => {
			for (let leagueId = 1; leagueId < LEAGUES_COUNT; leagueId++) {
				expect(TopWeekRewardConstants.getTier(TopWeekRewardConstants.MIN_WEEKLY_SCORE[leagueId] - 1)?.leagueId).toBe(leagueId - 1);
			}
		});

		it("caps at the royal league", () => {
			expect(TopWeekRewardConstants.getTier(10_000_000)?.leagueId).toBe(LeagueInfoConstants.ROYAL_LEAGUE_ID);
		});
	});

	it("defines one tier per league", () => {
		expect(TopWeekRewardConstants.MIN_WEEKLY_SCORE).toHaveLength(LEAGUES_COUNT);
		expect(TopWeekRewardConstants.MONEY).toHaveLength(LEAGUES_COUNT);
		expect(TopWeekRewardConstants.GEMS).toHaveLength(LEAGUES_COUNT);
	});

	it("asks for a strictly higher score and gives strictly more money and at least as many gems in each higher league", () => {
		for (let leagueId = 1; leagueId < LEAGUES_COUNT; leagueId++) {
			expect(TopWeekRewardConstants.MIN_WEEKLY_SCORE[leagueId]).toBeGreaterThan(TopWeekRewardConstants.MIN_WEEKLY_SCORE[leagueId - 1]);
			expect(TopWeekRewardConstants.MONEY[leagueId]).toBeGreaterThan(TopWeekRewardConstants.MONEY[leagueId - 1]);
			expect(TopWeekRewardConstants.GEMS[leagueId]).toBeGreaterThanOrEqual(TopWeekRewardConstants.GEMS[leagueId - 1]);
		}
	});

	it("starts every league counter at zero", () => {
		expect(TopWeekRewardConstants.emptyRewardedPlayersPerLeague()).toEqual(new Array(LEAGUES_COUNT).fill(0));
	});
});
