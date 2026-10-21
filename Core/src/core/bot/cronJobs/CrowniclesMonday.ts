import {
	DayOfTheWeek, setWeeklyCronJob
} from "../../utils/CronInterface";
import { Settings } from "../../database/game/models/Setting";
import { PacketUtils } from "../../utils/PacketUtils";
import { CrowniclesLogger } from "../../../../../Lib/src/logs/CrowniclesLogger";
import { botConfig } from "../../../bootstrap";
import { crowniclesInstance } from "../../../app";
import Player from "../../database/game/models/Player";
import { Op } from "sequelize";
import { makePacket } from "../../../../../Lib/src/packets/CrowniclesPacket";
import { TopWeekAnnouncementPacket } from "../../../../../Lib/src/packets/announcements/TopWeekAnnouncementPacket";
import { MqttTopicUtils } from "../../../../../Lib/src/utils/MqttTopicUtils";
import { Badge } from "../../../../../Lib/src/types/Badge";
import {
	asWeeks, weeksToMilliseconds
} from "../../../../../Lib/src/utils/TimeUtils";
import PlayerMissionsInfo from "../../database/game/models/PlayerMissionsInfo";
import { MapCache } from "../../maps/MapCache";
import { PlayerBadgesManager } from "../../database/game/models/PlayerBadges";
import { distributeTopWeekRewards } from "../TopWeekRewards";

export class CrowniclesMonday {
	public static async programCronJob(): Promise<void> {
		await setWeeklyCronJob(CrowniclesMonday.job, await Settings.NEXT_WEEKLY_RESET.getValue() < Date.now(), DayOfTheWeek.MONDAY);
	}

	static async job(): Promise<void> {
		if (!PacketUtils.isMqttConnected()) {
			CrowniclesLogger.error("MQTT is not connected, can't announce the end of the week. Trying again in 1 minute");
			setTimeout(CrowniclesMonday.job, 60000);
			return;
		}

		/*
		 * First program the next weekly end immediately at +7 days
		 * Then wait a bit before setting the next date, so we are sure to be past the date
		 *
		 * The first one is set immediately so if the bot crashes before programming the next one, it will be set anyway to approximately a valid date (at 1s max of difference)
		 */
		await Settings.NEXT_WEEKLY_RESET.setValue(await Settings.NEXT_WEEKLY_RESET.getValue() + weeksToMilliseconds(asWeeks(1)));
		CrowniclesMonday.topWeekEnd()
			.then();
		CrowniclesMonday.newPveIsland()
			.then();
	}

	/**
	 * End the top week
	 */
	static async topWeekEnd(): Promise<void> {
		// The best players must be logged before the rewards reset their weekly score
		await crowniclesInstance?.logsDatabase.log15BestTopWeek()
			.catch(error => CrowniclesLogger.errorWithObj("Failed to log the 15 best players of the top week", error));
		const winner = await Player.findOne({
			where: {
				weeklyScore: { [Op.gt]: 100 }
			},
			order: [
				["weeklyScore", "DESC"],
				["level", "DESC"]
			],
			limit: 1
		});
		const {
			rewardedPlayersPerTier, notifications
		} = await distributeTopWeekRewards();
		PacketUtils.announce(makePacket(TopWeekAnnouncementPacket, {
			...winner ? { winnerKeycloakId: winner.keycloakId } : {},
			rewardedPlayersPerTier
		}), MqttTopicUtils.getDiscordTopWeekAnnouncementTopic(botConfig.PREFIX));
		if (winner !== null) {
			await PlayerBadgesManager.addBadge(winner.id, Badge.TOP_WEEK);
		}
		await Player.update({ weeklyScore: 0 }, { where: {} });
		CrowniclesLogger.info("Weekly leaderboard has been reset !");
		if (notifications.length > 0) {
			PacketUtils.sendNotifications(notifications);
		}
		await PlayerMissionsInfo.resetShopBuyout();
		CrowniclesLogger.info("All players can now buy again points from the mission shop !");
		crowniclesInstance?.logsDatabase.logTopWeekEnd()
			.then();
	}

	/**
	 * Choose a new pve island
	 */
	static async newPveIsland(): Promise<void> {
		const newMapLink = MapCache.randomPveBoatLinkId(await Settings.PVE_ISLAND.getValue());
		CrowniclesLogger.info("New pve island map link of the week", { newMapLink });
		await Settings.PVE_ISLAND.setValue(newMapLink);
	}
}
