import {
	afterAll, beforeAll, beforeEach, describe, expect, it
} from "vitest";
import type { ModelStatic } from "sequelize";
import {
	CoreTestEnvironment, loadProductionModule, pinInertDailyMission, runAllOrThrow, setupCoreForTests
} from "../_coreSetup";
import type { Player as PlayerType } from "../../src/core/database/game/models/Player";
import type { PlayerMissionsInfo as PlayerMissionsInfoType } from "../../src/core/database/game/models/PlayerMissionsInfo";
import {
	TOP_WEEK_REWARD_TIERS, TopWeekRewardConstants, TopWeekRewardTierId
} from "../../../Lib/src/constants/TopWeekRewardConstants";

type TopWeekRewardsModule = typeof import("../../src/core/bot/TopWeekRewards");

const INITIAL_MONEY = 100;

const INITIAL_GEMS = 2;

const N_CONCURRENT_DISTRIBUTIONS = 5;

function tierOf(tierId: TopWeekRewardTierId): typeof TopWeekRewardConstants.TIERS[number] {
	return TopWeekRewardConstants.TIERS.find(tier => tier.id === tierId)!;
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
		const bronze = await seed("topweek-bronze", tierOf(TOP_WEEK_REWARD_TIERS.BRONZE).minWeeklyScore);
		const silver = await seed("topweek-silver", tierOf(TOP_WEEK_REWARD_TIERS.GOLD).minWeeklyScore - 1);
		const diamond = await seed("topweek-diamond", 60_000);

		const distribution = await distributeTopWeekRewards();

		await expectPlayerState(belowTiers, {
			money: INITIAL_MONEY,
			gems: INITIAL_GEMS,
			weeklyScore: TopWeekRewardConstants.MIN_REWARDED_WEEKLY_SCORE - 1
		});
		for (const [player, tierId] of [
			[bronze, TOP_WEEK_REWARD_TIERS.BRONZE],
			[silver, TOP_WEEK_REWARD_TIERS.SILVER],
			[diamond, TOP_WEEK_REWARD_TIERS.DIAMOND]
		] as const) {
			await expectPlayerState(player, {
				money: INITIAL_MONEY + tierOf(tierId).money,
				gems: INITIAL_GEMS + tierOf(tierId).gems,
				weeklyScore: 0
			});
		}

		expect(distribution.rewardedPlayersPerTier).toEqual({
			[TOP_WEEK_REWARD_TIERS.BRONZE]: 1,
			[TOP_WEEK_REWARD_TIERS.SILVER]: 1,
			[TOP_WEEK_REWARD_TIERS.GOLD]: 0,
			[TOP_WEEK_REWARD_TIERS.DIAMOND]: 1
		});
		expect(distribution.notifications.find(notification => notification.keycloakId === diamond.keycloakId)).toMatchObject({
			tierId: TOP_WEEK_REWARD_TIERS.DIAMOND,
			weeklyScore: 60_000,
			money: tierOf(TOP_WEEK_REWARD_TIERS.DIAMOND).money,
			gems: tierOf(TOP_WEEK_REWARD_TIERS.DIAMOND).gems
		});
		expect(distribution.notifications).toHaveLength(3);
	});

	it(`pays each player exactly once when ${N_CONCURRENT_DISTRIBUTIONS} distributions overlap`, async () => {
		const gold = await seed("topweek-race-gold", tierOf(TOP_WEEK_REWARD_TIERS.GOLD).minWeeklyScore);
		const bronze = await seed("topweek-race-bronze", tierOf(TOP_WEEK_REWARD_TIERS.BRONZE).minWeeklyScore);

		const distributions = await runAllOrThrow(
			Array.from({ length: N_CONCURRENT_DISTRIBUTIONS }, () => distributeTopWeekRewards())
		);

		await expectPlayerState(gold, {
			money: INITIAL_MONEY + tierOf(TOP_WEEK_REWARD_TIERS.GOLD).money,
			gems: INITIAL_GEMS + tierOf(TOP_WEEK_REWARD_TIERS.GOLD).gems,
			weeklyScore: 0
		});
		await expectPlayerState(bronze, {
			money: INITIAL_MONEY + tierOf(TOP_WEEK_REWARD_TIERS.BRONZE).money,
			gems: INITIAL_GEMS + tierOf(TOP_WEEK_REWARD_TIERS.BRONZE).gems,
			weeklyScore: 0
		});
		expect(distributions.flatMap(distribution => distribution.notifications)).toHaveLength(2);
	});
});
