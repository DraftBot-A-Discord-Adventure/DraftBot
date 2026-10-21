import { Op } from "sequelize";
import Player from "../database/game/models/Player";
import PlayerMissionsInfo from "../database/game/models/PlayerMissionsInfo";
import { Settings } from "../database/game/models/Setting";
import { withLockedPlayerAndMissions } from "../utils/withLockedPlayerAndMissions";
import { KingChallengeConstants } from "../../../../Lib/src/constants/KingChallengeConstants";
import {
	KingChallengeProgress, KingChallengeWeekSummary
} from "../../../../Lib/src/types/KingChallenge";
import { KingChallengeTierReachedPacket } from "../../../../Lib/src/packets/events/KingChallengeTierReachedPacket";
import {
	CrowniclesPacket, makePacket
} from "../../../../Lib/src/packets/CrowniclesPacket";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import { Locked } from "../../../../Lib/src/locks/withLockedEntities";

/**
 * The thresholds only change on the weekly reset, they are computed once and kept until then.
 * The promise is cached rather than its value so concurrent first reads share a single database read.
 */
let cachedThresholds: Promise<number[]> | null = null;

function parseReferenceScores(serializedScores: string): number[] {
	return serializedScores.split(",")
		.map(Number)
		.filter(score => Number.isFinite(score) && score > 0);
}

async function getReferenceScores(): Promise<number[]> {
	return parseReferenceScores(await Settings.KING_CHALLENGE_REFERENCE_SCORES.getValue());
}

/**
 * Weekly score required by each tier of the current week's king's challenge
 */
export function getKingChallengeThresholds(): Promise<number[]> {
	if (!cachedThresholds) {
		const thresholds = getReferenceScores()
			.then(referenceScores => KingChallengeConstants.computeThresholds(referenceScores));
		cachedThresholds = thresholds;
		thresholds.catch(() => {
			// A failed read must not stick for the whole week
			if (cachedThresholds === thresholds) {
				cachedThresholds = null;
			}
		});
	}
	return cachedThresholds;
}

/**
 * Pay the tiers reached by a locked player since their last rewarded tier, and announce the crossing in the response
 */
async function rewardKingChallengeTiersUnderLock(lockedPlayer: Locked<Player>, response: CrowniclesPacket[]): Promise<void> {
	const thresholds = await getKingChallengeThresholds();
	const previousTier = lockedPlayer.kingChallengeTier;
	const reachedTier = KingChallengeConstants.getReachedTier(lockedPlayer.weeklyScore, thresholds);
	if (reachedTier <= previousTier) {
		return;
	}

	// Persisted before granting anything: a score gained from these rewards (e.g. a completed mission) must not pay the same tiers again
	lockedPlayer.kingChallengeTier = reachedTier;
	await lockedPlayer.save();

	// The crossing is announced before the missions completed by its rewards
	const packetIndex = response.length;
	const reward = KingChallengeConstants.sumRewards(previousTier, reachedTier);
	await lockedPlayer.addMoney({
		response,
		amount: reward.money,
		reason: NumberChangeReason.KING_CHALLENGE,
		ignoreBlessing: true
	});
	const grantedTokens = await lockedPlayer.addTokensAndGetActualGain({
		response,
		amount: reward.tokens,
		reason: NumberChangeReason.KING_CHALLENGE
	});
	if (reward.gems > 0) {
		await PlayerMissionsInfo.withLocked(lockedPlayer.id, lockedMissionsInfo => lockedMissionsInfo.addGems(reward.gems, lockedPlayer.keycloakId, NumberChangeReason.KING_CHALLENGE));
	}

	response.splice(packetIndex, 0, makePacket(KingChallengeTierReachedPacket, {
		keycloakId: lockedPlayer.keycloakId,
		tier: reachedTier,
		crossedTiers: reachedTier - previousTier,
		reward: {
			...reward,
			tokens: grantedTokens
		},
		...reachedTier < thresholds.length ? { pointsToNextTier: thresholds[reachedTier] - lockedPlayer.weeklyScore } : {},
		ownedTokens: lockedPlayer.tokens
	}));
}

/**
 * Reward the king's challenge tiers newly reached by the player. Called after each weekly score gain.
 * @param player The player who gained points, synchronized with the database afterward
 * @param response
 */
export async function applyKingChallengeProgress(player: Player, response: CrowniclesPacket[]): Promise<void> {
	const thresholds = await getKingChallengeThresholds();
	if (KingChallengeConstants.getReachedTier(player.weeklyScore, thresholds) <= player.kingChallengeTier) {
		return;
	}
	const updatedPlayer = await withLockedPlayerAndMissions(player.id, async lockedPlayer => {
		await rewardKingChallengeTiersUnderLock(lockedPlayer, response);
		return lockedPlayer;
	});
	Object.assign(player, updatedPlayer);
}

/**
 * Progress of the player in the current week's king's challenge
 * @param player
 */
export async function getKingChallengeProgress(player: Player): Promise<KingChallengeProgress> {
	return {
		weeklyScore: player.weeklyScore,
		tier: player.kingChallengeTier,
		thresholds: await getKingChallengeThresholds(),
		nextResetDate: await Settings.NEXT_WEEKLY_RESET.getValue()
	};
}

/**
 * Summary of the king's challenge of the week ending. Must run before the weekly reset.
 */
export async function getKingChallengeWeekSummary(): Promise<KingChallengeWeekSummary> {
	return {
		rewardedPlayers: await Player.count({ where: { kingChallengeTier: { [Op.gte]: 1 } } }),
		completedPlayers: await Player.count({ where: { kingChallengeTier: KingChallengeConstants.TIER_COUNT } })
	};
}

/**
 * Weekly score of the reference rank for the week ending, or null if too few players scored. Must run before the weekly reset.
 */
export async function getWeeklyReferenceScore(): Promise<number | null> {
	const referencePlayer = await Player.findOne({
		attributes: ["weeklyScore"],
		where: { weeklyScore: { [Op.gt]: 0 } },
		order: [["weeklyScore", "DESC"]],
		offset: KingChallengeConstants.REFERENCE_RANK - 1
	});
	return referencePlayer?.weeklyScore ?? null;
}

/**
 * Add the reference score of the week ending to the history, which sets the thresholds of the new week
 * @param referenceScore
 */
export async function recordKingChallengeReferenceScore(referenceScore: number): Promise<void> {
	const referenceScores = KingChallengeConstants.pushReferenceScore(await getReferenceScores(), referenceScore);
	await Settings.KING_CHALLENGE_REFERENCE_SCORES.setValue(referenceScores.join(","));
	cachedThresholds = null;
}
