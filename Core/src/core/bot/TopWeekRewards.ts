import { Op } from "sequelize";
import Player from "../database/game/models/Player";
import PlayerMissionsInfo from "../database/game/models/PlayerMissionsInfo";
import { withLockedPlayerAndMissions } from "../utils/withLockedPlayerAndMissions";
import { LockedRowNotFoundError } from "../../../../Lib/src/locks/withLockedEntities";
import {
	TopWeekRewardConstants, TopWeekRewardedPlayersPerLeague
} from "../../../../Lib/src/constants/TopWeekRewardConstants";
import { TopWeekRewardNotificationPacket } from "../../../../Lib/src/packets/notifications/TopWeekRewardNotificationPacket";
import { makePacket } from "../../../../Lib/src/packets/CrowniclesPacket";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import { CrowniclesLogger } from "../../../../Lib/src/logs/CrowniclesLogger";

export type TopWeekRewardsDistribution = {
	rewardedPlayersPerLeague: TopWeekRewardedPlayersPerLeague;
	notifications: TopWeekRewardNotificationPacket[];
};

/**
 * Grant the reward of the tier reached by a locked player and reset their weekly score in the same critical section,
 * so a player is rewarded if and only if their weekly score has been consumed: an interrupted distribution can never pay twice.
 * @returns The notification to send to the player, or null if their weekly score no longer reaches a tier
 */
async function rewardPlayerUnderLock(lockedPlayer: Player): Promise<TopWeekRewardNotificationPacket | null> {
	const weeklyScore = lockedPlayer.weeklyScore;
	const tier = TopWeekRewardConstants.getTier(weeklyScore);
	if (!tier) {
		return null;
	}

	// The player is offline: the packets of the missions completed by this money gain are dropped, their rewards are still granted
	await lockedPlayer.addMoney({
		response: [],
		amount: tier.money,
		reason: NumberChangeReason.TOP_WEEK_REWARD,
		ignoreBlessing: true
	});
	if (tier.gems > 0) {
		await PlayerMissionsInfo.withLocked(lockedPlayer.id, lockedMissionsInfo => lockedMissionsInfo.addGems(tier.gems, lockedPlayer.keycloakId, NumberChangeReason.TOP_WEEK_REWARD));
	}
	lockedPlayer.weeklyScore = 0;
	await lockedPlayer.save();

	return makePacket(TopWeekRewardNotificationPacket, {
		keycloakId: lockedPlayer.keycloakId,
		leagueId: tier.leagueId,
		weeklyScore,
		money: tier.money,
		gems: tier.gems
	});
}

/**
 * Reward every player whose weekly score reaches a top week reward tier. Must run before the weekly score reset.
 */
export async function distributeTopWeekRewards(): Promise<TopWeekRewardsDistribution> {
	const distribution: TopWeekRewardsDistribution = {
		rewardedPlayersPerLeague: TopWeekRewardConstants.emptyRewardedPlayersPerLeague(),
		notifications: []
	};
	const candidates = await Player.findAll({
		attributes: ["id"],
		where: { weeklyScore: { [Op.gte]: TopWeekRewardConstants.MIN_REWARDED_WEEKLY_SCORE } }
	});

	for (const candidate of candidates) {
		try {
			const notification = await withLockedPlayerAndMissions(candidate.id, rewardPlayerUnderLock);
			if (notification) {
				distribution.rewardedPlayersPerLeague[notification.leagueId]++;
				distribution.notifications.push(notification);
			}
		}
		catch (error) {
			if (error instanceof LockedRowNotFoundError) {
				CrowniclesLogger.warn(`Top week rewards: player ${candidate.id} vanished before being rewarded`);
				continue;
			}

			// One failing player must not deprive the others of their reward
			CrowniclesLogger.errorWithObj(`Top week rewards: failed to reward player ${candidate.id}`, error);
		}
	}

	CrowniclesLogger.info("Top week rewards distributed", { rewardedPlayersPerLeague: distribution.rewardedPlayersPerLeague });
	return distribution;
}
