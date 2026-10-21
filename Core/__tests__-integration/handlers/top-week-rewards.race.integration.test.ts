import {
	afterAll, beforeAll, beforeEach, describe, expect, it
} from "vitest";
import type { ModelStatic } from "sequelize";
import {
	CoreTestEnvironment, loadProductionModule, pinInertDailyMission, runAllOrThrow, setupCoreForTests
} from "../_coreSetup";
import type { Player as PlayerType } from "../../src/core/database/game/models/Player";
import type { PlayerMissionsInfo as PlayerMissionsInfoType } from "../../src/core/database/game/models/PlayerMissionsInfo";
import { TopWeekRewardConstants } from "../../../Lib/src/constants/TopWeekRewardConstants";
import { LeagueInfoConstants } from "../../../Lib/src/constants/LeagueInfoConstants";

type TopWeekRewardsModule = typeof import("../../src/core/bot/TopWeekRewards");

const INITIAL_MONEY = 100;

const INITIAL_GEMS = 2;

const N_CONCURRENT_DISTRIBUTIONS = 5;

const WOOD_LEAGUE_ID = 0;

const SILVER_LEAGUE_ID = 4;

const GOLD_LEAGUE_ID = 5;

const ROYAL_LEAGUE_ID = LeagueInfoConstants.ROYAL_LEAGUE_ID;

function rewardsOf(leagueId: number): { money: number; gems: number } {
	return {
		money: TopWeekRewardConstants.MONEY[leagueId],
		gems: TopWeekRewardConstants.GEMS[leagueId]
	};
}

/**
 * The top week rewards are paid once per week to every player whose weekly score reaches a tier.
 * Invariants: a rewarded player receives the money and gems of their highest tier exactly once,
 * and their weekly score is consumed in the same critical section, so overlapping or retried
 * distributions can never pay twice.
 */
describe("top week rewards distribution", () => {
	let env: CoreTestEnvironment;
	let Player: ModelStatic<PlayerType>;
	let PlayerMissionsInfo: ModelStatic<PlayerMissionsInfoType>;
	let distributeTopWeekRewards: TopWeekRewardsModule["distributeTopWeekRewards"];

	beforeAll(async () => {
		env = await setupCoreForTests("topweekrewards");
		Player = env.crownicles.gameDatabase.sequelize.models.Player as ModelStatic<PlayerType>;
		PlayerMissionsInfo = env.crownicles.gameDatabase.sequelize.models.PlayerMissionsInfo as ModelStatic<PlayerMissionsInfoType>;
		distributeTopWeekRewards = loadProductionModule<TopWeekRewardsModule>("core/bot/TopWeekRewards").distributeTopWeekRewards;
	});

	afterAll(async () => {
		await env?.teardown();
	});

	beforeEach(async () => {
		await env.crownicles.gameDatabase.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
		try {
			await PlayerMissionsInfo.destroy({
				truncate: true, force: true
			});
			await Player.destroy({
				truncate: true, force: true
			});
		}
		finally {
			await env.crownicles.gameDatabase.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
		}
		await pinInertDailyMission(env);
	});

	async function seed(keycloakId: string, weeklyScore: number): Promise<PlayerType> {
		const player = await Player.create({
			keycloakId,
			weeklyScore,
			money: INITIAL_MONEY
		});
		await PlayerMissionsInfo.create({
			playerId: player.id,
			gems: INITIAL_GEMS
		});
		return player;
	}

	async function expectPlayerState(player: PlayerType, expected: {
		money: number; gems: number; weeklyScore: number;
	}): Promise<void> {
		const freshPlayer = await Player.findByPk(player.id);
		const freshMissionsInfo = await PlayerMissionsInfo.findByPk(player.id);
		expect({
			money: freshPlayer!.money,
			gems: freshMissionsInfo!.gems,
			weeklyScore: freshPlayer!.weeklyScore
		}).toEqual(expected);
	}

	it("pays the highest reached tier, consumes the weekly score and ignores players below the lowest tier", async () => {
		const belowTiers = await seed("topweek-below", TopWeekRewardConstants.MIN_REWARDED_WEEKLY_SCORE - 1);
		const wood = await seed("topweek-wood", TopWeekRewardConstants.MIN_WEEKLY_SCORE[WOOD_LEAGUE_ID]);
		const silver = await seed("topweek-silver", TopWeekRewardConstants.MIN_WEEKLY_SCORE[GOLD_LEAGUE_ID] - 1);
		const royal = await seed("topweek-royal", 100_000);

		const distribution = await distributeTopWeekRewards();

		await expectPlayerState(belowTiers, {
			money: INITIAL_MONEY,
			gems: INITIAL_GEMS,
			weeklyScore: TopWeekRewardConstants.MIN_REWARDED_WEEKLY_SCORE - 1
		});
		for (const [player, leagueId] of [
			[wood, WOOD_LEAGUE_ID],
			[silver, SILVER_LEAGUE_ID],
			[royal, ROYAL_LEAGUE_ID]
		] as const) {
			await expectPlayerState(player, {
				money: INITIAL_MONEY + rewardsOf(leagueId).money,
				gems: INITIAL_GEMS + rewardsOf(leagueId).gems,
				weeklyScore: 0
			});
		}

		const expectedPerLeague = TopWeekRewardConstants.emptyRewardedPlayersPerLeague();
		expectedPerLeague[WOOD_LEAGUE_ID] = 1;
		expectedPerLeague[SILVER_LEAGUE_ID] = 1;
		expectedPerLeague[ROYAL_LEAGUE_ID] = 1;
		expect(distribution.rewardedPlayersPerLeague).toEqual(expectedPerLeague);
		expect(distribution.notifications.find(notification => notification.keycloakId === royal.keycloakId)).toMatchObject({
			leagueId: ROYAL_LEAGUE_ID,
			weeklyScore: 100_000,
			...rewardsOf(ROYAL_LEAGUE_ID)
		});
		expect(distribution.notifications).toHaveLength(3);
	});

	it(`pays each player exactly once when ${N_CONCURRENT_DISTRIBUTIONS} distributions overlap`, async () => {
		const gold = await seed("topweek-race-gold", TopWeekRewardConstants.MIN_WEEKLY_SCORE[GOLD_LEAGUE_ID]);
		const wood = await seed("topweek-race-wood", TopWeekRewardConstants.MIN_WEEKLY_SCORE[WOOD_LEAGUE_ID]);

		const distributions = await runAllOrThrow(
			Array.from({ length: N_CONCURRENT_DISTRIBUTIONS }, () => distributeTopWeekRewards())
		);

		await expectPlayerState(gold, {
			money: INITIAL_MONEY + rewardsOf(GOLD_LEAGUE_ID).money,
			gems: INITIAL_GEMS + rewardsOf(GOLD_LEAGUE_ID).gems,
			weeklyScore: 0
		});
		await expectPlayerState(wood, {
			money: INITIAL_MONEY + rewardsOf(WOOD_LEAGUE_ID).money,
			gems: INITIAL_GEMS + rewardsOf(WOOD_LEAGUE_ID).gems,
			weeklyScore: 0
		});
		expect(distributions.flatMap(distribution => distribution.notifications)).toHaveLength(2);
	});
});
