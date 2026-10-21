import {
	afterAll, afterEach, beforeAll, describe, expect, it, vi
} from "vitest";
import type { ModelStatic } from "sequelize";
import {
	CoreTestEnvironment, loadProductionModule, setupCoreForTests
} from "../_coreSetup";
import type { Player as PlayerType } from "../../src/core/database/game/models/Player";
import { KingChallengeConstants } from "../../../Lib/src/constants/KingChallengeConstants";
import type { TopWeekAnnouncementPacket } from "../../../Lib/src/packets/announcements/TopWeekAnnouncementPacket";

type CrowniclesMondayModule = typeof import("../../src/core/bot/cronJobs/CrowniclesMonday");
type PacketUtilsModule = typeof import("../../src/core/utils/PacketUtils");
type KingChallengeModule = typeof import("../../src/core/kingChallenge/KingChallenge");

/**
 * End of the week: the reference scores of the week ending are read before the reset, the weekly scores
 * and the rewarded tiers are reset together, then those reference scores set the thresholds of the new week.
 */
describe("king's challenge week end", () => {
	let env: CoreTestEnvironment;
	let Player: ModelStatic<PlayerType>;
	let CrowniclesMonday: CrowniclesMondayModule["CrowniclesMonday"];
	let PacketUtils: PacketUtilsModule["PacketUtils"];
	let kingChallenge: KingChallengeModule;

	beforeAll(async () => {
		env = await setupCoreForTests("kingchallengeweekend");
		Player = env.crownicles.gameDatabase.sequelize.models.Player as ModelStatic<PlayerType>;
		CrowniclesMonday = loadProductionModule<CrowniclesMondayModule>("core/bot/cronJobs/CrowniclesMonday").CrowniclesMonday;
		PacketUtils = loadProductionModule<PacketUtilsModule>("core/utils/PacketUtils").PacketUtils;
		kingChallenge = loadProductionModule<KingChallengeModule>("core/kingChallenge/KingChallenge");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	afterAll(async () => {
		await env?.teardown();
	});

	it("announces the winner, resets the tiers with the weekly scores and sets the thresholds of the new week", async () => {
		const seededPlayers = [
			{
				keycloakId: "weekend-champion", weeklyScore: 60_000, kingChallengeTier: KingChallengeConstants.TIER_COUNT
			},
			{
				keycloakId: "weekend-second", weeklyScore: 40_000, kingChallengeTier: 7
			},
			{
				keycloakId: "weekend-third", weeklyScore: 30_000, kingChallengeTier: 6
			},
			{
				keycloakId: "weekend-fourth", weeklyScore: 20_000, kingChallengeTier: 6
			},
			{
				keycloakId: "weekend-fifth", weeklyScore: 10_000, kingChallengeTier: 5
			},
			{
				keycloakId: "weekend-idle", weeklyScore: 1_000, kingChallengeTier: 0
			}
		];
		for (const seededPlayer of seededPlayers) {
			await Player.create(seededPlayer);
		}
		const announcements: TopWeekAnnouncementPacket[] = [];
		vi.spyOn(PacketUtils, "announce").mockImplementation(packet => {
			announcements.push(packet as TopWeekAnnouncementPacket);
		});

		await CrowniclesMonday.topWeekEnd();

		expect(announcements).toEqual([{ winnerKeycloakId: "weekend-champion" }]);
		const players = await Player.findAll({ attributes: ["weeklyScore", "kingChallengeTier"] });
		expect(players.map(player => [player.weeklyScore, player.kingChallengeTier])).toEqual(seededPlayers.map(() => [0, 0]));
		expect(await kingChallenge.getKingChallengeThresholds()).toEqual(KingChallengeConstants.computeThresholds(
			KingChallengeConstants.pushReferenceScores(KingChallengeConstants.DEFAULT_REFERENCE_SCORES, {
				ladder: 10_000,
				champion: 60_000
			})
		));
	});
});
