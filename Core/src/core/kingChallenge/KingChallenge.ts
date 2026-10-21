import { Op } from "sequelize";
import Player from "../database/game/models/Player";
import PlayerMissionsInfo from "../database/game/models/PlayerMissionsInfo";
import { Settings } from "../database/game/models/Setting";
import { withLockedPlayerAndMissions } from "../utils/withLockedPlayerAndMissions";
import { KingChallengeConstants } from "../../../../Lib/src/constants/KingChallengeConstants";
import {
	KingChallengeProgress, KingChallengeReferenceScores, KingChallengeWeekScores, KingChallengeWeekSummary
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

async function getReferenceScores(): Promise<KingChallengeReferenceScores> {
	return {
		ladder: parseReferenceScores(await Settings.KING_CHALLENGE_REFERENCE_SCORES.getValue()),
		champion: parseReferenceScores(await Settings.KING_CHALLENGE_CHAMPION_SCORES.getValue())
	};
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

	/*
	 * Built before granting anything: the rewards can complete a mission whose points cross the next tier,
	 * which would make the remaining points of this crossing negative. It is also announced before those missions.
	 * The tokens of the challenge ignore the cap, so the granted amount is the reward itself.
	 */
	const reward = KingChallengeConstants.sumRewards(previousTier, reachedTier);
	response.push(makePacket(KingChallengeTierReachedPacket, {
		keycloakId: lockedPlayer.keycloakId,
		tier: reachedTier,
		crossedTiers: reachedTier - previousTier,
		reward,
		...reachedTier < thresholds.length ? { pointsToNextTier: thresholds[reachedTier] - lockedPlayer.weeklyScore } : {},
		ownedTokens: lockedPlayer.tokens + reward.tokens
	}));

	await lockedPlayer.addMoney({
		response,
		amount: reward.money,
		reason: NumberChangeReason.KING_CHALLENGE,
		ignoreBlessing: true
	});
	await lockedPlayer.addTokens({
		response,
		amount: reward.tokens,
		reason: NumberChangeReason.KING_CHALLENGE
	});
	if (reward.gems > 0) {
		await PlayerMissionsInfo.withLocked(lockedPlayer.id, lockedMissionsInfo => lockedMissionsInfo.addGems(reward.gems, lockedPlayer.keycloakId, NumberChangeReason.KING_CHALLENGE));
	}
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
 * Weekly scores of the best player and of the reference rank for the week ending, or null if too few players scored.
 * Must run before the weekly reset.
 */
export async function getWeeklyReferenceScores(): Promise<KingChallengeWeekScores | null> {
	const bestPlayers = await Player.findAll({
		attributes: ["weeklyScore"],
		where: { weeklyScore: { [Op.gt]: 0 } },
		order: [["weeklyScore", "DESC"]],
		limit: KingChallengeConstants.REFERENCE_RANK
	});
	if (bestPlayers.length < KingChallengeConstants.REFERENCE_RANK) {
		return null;
	}
	return {
		ladder: bestPlayers[KingChallengeConstants.REFERENCE_RANK - 1].weeklyScore,
		champion: bestPlayers[0].weeklyScore
	};
}

/**
 * Add the scores of the week ending to the history, which sets the thresholds of the new week
 * @param weekScores
 */
export async function recordKingChallengeReferenceScores(weekScores: KingChallengeWeekScores): Promise<void> {
	const referenceScores = KingChallengeConstants.pushReferenceScores(await getReferenceScores(), weekScores);
	await Settings.KING_CHALLENGE_REFERENCE_SCORES.setValue(referenceScores.ladder.join(","));
	await Settings.KING_CHALLENGE_CHAMPION_SCORES.setValue(referenceScores.champion.join(","));
	cachedThresholds = null;
}
