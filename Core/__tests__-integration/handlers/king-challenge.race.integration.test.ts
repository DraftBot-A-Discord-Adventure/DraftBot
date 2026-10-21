import {
	afterAll, beforeAll, beforeEach, describe, expect, it
} from "vitest";
import type { ModelStatic } from "sequelize";
import {
	CoreTestEnvironment, loadProductionModule, pinInertDailyMission, runAllOrThrow, setupCoreForTests
} from "../_coreSetup";
import type { Player as PlayerType } from "../../src/core/database/game/models/Player";
import type { PlayerMissionsInfo as PlayerMissionsInfoType } from "../../src/core/database/game/models/PlayerMissionsInfo";
import { KingChallengeConstants } from "../../../Lib/src/constants/KingChallengeConstants";
import { NumberChangeReason } from "../../../Lib/src/constants/LogsConstants";
import { TokensConstants } from "../../../Lib/src/constants/TokensConstants";
import type { CrowniclesPacket } from "../../../Lib/src/packets/CrowniclesPacket";
import type { KingChallengeTierReachedPacket } from "../../../Lib/src/packets/events/KingChallengeTierReachedPacket";

type KingChallengeModule = typeof import("../../src/core/kingChallenge/KingChallenge");

const THRESHOLDS = KingChallengeConstants.computeThresholds(KingChallengeConstants.DEFAULT_REFERENCE_SCORES);

const INITIAL_MONEY = 100;

const INITIAL_GEMS = 2;

const N_CONCURRENT_GAINS = 10;

function tierReachedPackets(response: CrowniclesPacket[]): KingChallengeTierReachedPacket[] {
	return response.filter(packet => packet.constructor.name === "KingChallengeTierReachedPacket") as KingChallengeTierReachedPacket[];
}

/**
 * The king's challenge pays each tier once per week, when the weekly score first reaches it.
 * Invariants checked on the persisted state: the rewards of exactly the crossed tiers are granted,
 * a tier is never paid twice (score lost then regained, concurrent gains), and the tokens are
 * credited even above the token cap.
 */
describe("king's challenge", () => {
	let env: CoreTestEnvironment;
	let Player: ModelStatic<PlayerType>;
	let PlayerMissionsInfo: ModelStatic<PlayerMissionsInfoType>;
	let kingChallenge: KingChallengeModule;

	beforeAll(async () => {
		env = await setupCoreForTests("kingchallenge");
		Player = env.crownicles.gameDatabase.sequelize.models.Player as ModelStatic<PlayerType>;
		PlayerMissionsInfo = env.crownicles.gameDatabase.sequelize.models.PlayerMissionsInfo as ModelStatic<PlayerMissionsInfoType>;
		kingChallenge = loadProductionModule<KingChallengeModule>("core/kingChallenge/KingChallenge");
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

	async function seed(keycloakId: string, weeklyScore: number, tokens = 0): Promise<PlayerType> {
		const player = await Player.create({
			keycloakId,
			weeklyScore,
			score: weeklyScore,
			money: INITIAL_MONEY,
			tokens
		});
		await PlayerMissionsInfo.create({
			playerId: player.id,
			gems: INITIAL_GEMS
		});
		return player;
	}

	async function gainScore(playerId: number, amount: number, response: CrowniclesPacket[] = []): Promise<void> {
		const player = (await Player.findByPk(playerId))!;
		await player.addScore({
			response,
			amount,
			reason: NumberChangeReason.TEST,
			ignoreBlessing: true
		});
	}

	async function expectRewarded(playerId: number, tier: number, initialTokens = 0): Promise<void> {
		const reward = KingChallengeConstants.sumRewards(0, tier);
		const player = (await Player.findByPk(playerId))!;
		const missionsInfo = (await PlayerMissionsInfo.findByPk(playerId))!;
		expect({
			tier: player.kingChallengeTier,
			money: player.money,
			tokens: player.tokens,
			gems: missionsInfo.gems
		}).toEqual({
			tier,
			money: INITIAL_MONEY + reward.money,
			tokens: initialTokens + reward.tokens,
			gems: INITIAL_GEMS + reward.gems
		});
	}

	it("pays every tier crossed at once and announces the crossing", async () => {
		const player = await seed("king-burst", THRESHOLDS[0] - 1);
		const response: CrowniclesPacket[] = [];

		await gainScore(player.id, THRESHOLDS[2] - THRESHOLDS[0] + 1, response);

		await expectRewarded(player.id, 3);
		const [packet] = tierReachedPackets(response);
		expect(packet).toMatchObject({
			tier: 3,
			crossedTiers: 3,
			reward: KingChallengeConstants.sumRewards(0, 3),
			pointsToNextTier: THRESHOLDS[3] - THRESHOLDS[2]
		});
	});

	it("pays nothing below the first tier", async () => {
		const player = await seed("king-below", 0);
		const response: CrowniclesPacket[] = [];

		await gainScore(player.id, THRESHOLDS[0] - 1, response);

		await expectRewarded(player.id, 0);
		expect(tierReachedPackets(response)).toHaveLength(0);
	});

	it("never pays a tier twice when the weekly score drops and comes back", async () => {
		const player = await seed("king-yoyo", 0);
		await gainScore(player.id, THRESHOLDS[1]);

		await gainScore(player.id, -(THRESHOLDS[1] - THRESHOLDS[0] + 1));
		const response: CrowniclesPacket[] = [];
		await gainScore(player.id, THRESHOLDS[1] - THRESHOLDS[0] + 1, response);

		await expectRewarded(player.id, 2);
		expect(tierReachedPackets(response)).toHaveLength(0);
	});

	it("credits the tokens even above the token cap", async () => {
		const hoardedTokens = TokensConstants.MAX * 2;
		const player = await seed("king-hoarder", THRESHOLDS[0] - 1, hoardedTokens);

		await gainScore(player.id, 1);

		await expectRewarded(player.id, 1, hoardedTokens);
	});

	it(`pays a tier exactly once when ${N_CONCURRENT_GAINS} score gains race to cross it`, async () => {
		const player = await seed("king-race", THRESHOLDS[0] - 1);

		const responses = Array.from({ length: N_CONCURRENT_GAINS }, (): CrowniclesPacket[] => []);
		await runAllOrThrow(responses.map(response => gainScore(player.id, 1, response)));

		await expectRewarded(player.id, 1);
		expect(responses.flatMap(tierReachedPackets)).toHaveLength(1);
	});

	it("shows the progress of the week with the coming Monday reset", async () => {
		const player = await seed("king-progress", 0);
		await gainScore(player.id, THRESHOLDS[1]);

		const progress = await kingChallenge.getKingChallengeProgress((await Player.findByPk(player.id))!);

		expect(progress).toMatchObject({
			weeklyScore: THRESHOLDS[1],
			tier: 2,
			thresholds: THRESHOLDS
		});
		expect(progress.nextResetDate).toBeGreaterThan(Date.now());
		expect(progress.nextResetDate).toBeLessThanOrEqual(Date.now() + 7 * 24 * 60 * 60 * 1000);
		expect(new Date(progress.nextResetDate + 1).getDay()).toBe(1);
	});

	it("records the reference scores of the week that set the next thresholds", async () => {
		await seed("king-summary-completed", 0);
		await gainScore((await Player.findOne({ where: { keycloakId: "king-summary-completed" } }))!.id, THRESHOLDS[THRESHOLDS.length - 1]);
		const weeklyScores = [THRESHOLDS[0], 50_000, 40_000, 30_000, 20_000];
		for (const [index, weeklyScore] of weeklyScores.entries()) {
			await seed(`king-summary-${index}`, weeklyScore);
		}

		// Best weekly scores: the champion threshold, 50 000, 40 000, 30 000, then 20 000 as the fifth one
		const weekScores = await kingChallenge.getWeeklyReferenceScores();
		expect(weekScores).toEqual({
			ladder: 20_000,
			champion: THRESHOLDS[THRESHOLDS.length - 1]
		});

		await kingChallenge.recordKingChallengeReferenceScores(weekScores!);
		const expectedReferences = KingChallengeConstants.pushReferenceScores(KingChallengeConstants.DEFAULT_REFERENCE_SCORES, weekScores!);
		expect(await kingChallenge.getKingChallengeThresholds()).toEqual(KingChallengeConstants.computeThresholds(expectedReferences));
	});
});
