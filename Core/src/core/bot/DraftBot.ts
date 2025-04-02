import { PacketListenerServer } from "../../../../Lib/src/packets/PacketListener";
import { GameDatabase } from "../database/game/GameDatabase";
import { LogsDatabase } from "../database/logs/LogsDatabase";
import {
	botConfig, draftBotInstance
} from "../../index";
import { Settings } from "../database/game/models/Setting";
import { PetConstants } from "../../../../Lib/src/constants/PetConstants";
import {
	Op, Sequelize
} from "sequelize";
import PetEntity from "../database/game/models/PetEntity";
import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";
import { PotionDataController } from "../../data/Potion";
import {
	getNextDay2AM, getNextSaturdayMidnight, getNextSundayMidnight
} from "../../../../Lib/src/utils/TimeUtils";
import { TIMEOUT_FUNCTIONS } from "../../../../Lib/src/constants/TimeoutFunctionsConstants";
import { MapCache } from "../maps/MapCache";
import { registerAllPacketHandlers } from "../packetHandlers/PacketHandler";
import { Logger } from "../../../../Lib/src/instances/Logger";
import { CommandsTest } from "../CommandsTest";
import Player from "../database/game/models/Player";
import { FightConstants } from "../../../../Lib/src/constants/FightConstants";
import { PacketUtils } from "../utils/PacketUtils";
import { makePacket } from "../../../../Lib/src/packets/DraftBotPacket";
import { TopWeekAnnouncementPacket } from "../../../../Lib/src/packets/announcements/TopWeekAnnouncementPacket";
import { TopWeekFightAnnouncementPacket } from "../../../../Lib/src/packets/announcements/TopWeekFightAnnouncementPacket";
import PlayerMissionsInfo from "../database/game/models/PlayerMissionsInfo";
import { ScheduledReportNotifications } from "../database/game/models/ScheduledReportNotification";
import { ReachDestinationNotificationPacket } from "../../../../Lib/src/packets/notifications/ReachDestinationNotificationPacket";
import { MapLocationDataController } from "../../data/MapLocation";
import * as fs from "fs";
import { MqttTopicUtils } from "../../../../Lib/src/utils/MqttTopicUtils";
import { initializeAllClassBehaviors } from "../fights/AiBehaviorController";
import { initializeAllPetBehaviors } from "../fights/PetAssistManager";

export class DraftBot {
	public readonly packetListener: PacketListenerServer;

	public readonly gameDatabase: GameDatabase;

	public readonly logsDatabase: LogsDatabase;

	public readonly logger = Logger.getInstance("DraftBot");

	constructor() {
		// Register commands
		this.packetListener = new PacketListenerServer();

		// Databases
		this.gameDatabase = new GameDatabase();
		this.logsDatabase = new LogsDatabase();
	}

	/**
	 * Launch the program that executes the top week reset
	 */
	static programWeeklyTimeout(): void {
		const millisTill = getNextSundayMidnight().valueOf() - Date.now();
		if (millisTill === 0) {
			// Case at 0:00:00
			setTimeout(DraftBot.programWeeklyTimeout, TIMEOUT_FUNCTIONS.TOP_WEEK_TIMEOUT);
			return;
		}
		setTimeout(DraftBot.weeklyTimeout, millisTill);
	}

	/**
	 * Launch the program that execute the season reset
	 */
	static programSeasonTimeout(): void {
		const millisTill = getNextSaturdayMidnight().valueOf() - Date.now();
		if (millisTill === 0) {
			// Case at 0:00:00
			setTimeout(DraftBot.programSeasonTimeout, TIMEOUT_FUNCTIONS.SEASON_TIMEOUT);
			return;
		}
		setTimeout(DraftBot.seasonEnd, millisTill);
	}

	/**
	 * Execute all the daily tasks
	 */
	static dailyTimeout(): void {
		Settings.NEXT_DAILY_RESET.setValue(getNextDay2AM().valueOf()).then();
		DraftBot.randomPotion().finally(() => null);
		DraftBot.randomLovePointsLoose().then(petLoveChange => draftBotInstance.logsDatabase.logDailyTimeout(petLoveChange).then());
		draftBotInstance.logsDatabase.log15BestTopWeek().then();
		DraftBot.programDailyTimeout();
	}

	/**
	 * Update the random potion sold in the shop
	 */
	static async randomPotion(): Promise<void> {
		console.log("INFO: Daily timeout");
		const previousPotionId = await Settings.SHOP_POTION.getValue();
		const newPotionId = PotionDataController.instance.randomShopPotion(previousPotionId).id;
		await Settings.SHOP_POTION.setValue(newPotionId);
		console.info(`INFO : new potion in shop : ${newPotionId}`);
		draftBotInstance.logsDatabase.logDailyPotion(newPotionId).then();
	}

	/**
	 * Make some pet lose some love points
	 */
	static async randomLovePointsLoose(): Promise<boolean> {
		const sequelize = require("sequelize");
		if (RandomUtils.draftbotRandom.bool()) {
			console.log("INFO: All pets lost 4 loves point");
			await PetEntity.update(
				{
					lovePoints: sequelize.literal(
						"CASE WHEN lovePoints - 4 < 0 THEN 0 ELSE lovePoints - 4 END"
					)
				},
				{
					where: {
						lovePoints: {
							[Op.notIn]: [PetConstants.MAX_LOVE_POINTS, 0]
						}
					}
				}
			);
			return true;
		}
		return false;
	}

	/**
	 * Launch the program that executes the daily tasks
	 */
	static programDailyTimeout(): void {
		const millisTill = getNextDay2AM().valueOf() - Date.now();
		if (millisTill === 0) {
			// Case at 2:00:00
			setTimeout(DraftBot.programDailyTimeout, TIMEOUT_FUNCTIONS.DAILY_TIMEOUT);
			return;
		}
		setTimeout(DraftBot.dailyTimeout, millisTill);
	}

	/**
	 * End the fight season
	 */
	static async seasonEnd(): Promise<void> {
		if (!PacketUtils.isMqttConnected()) {
			console.error("MQTT is not connected, can't announce the end of the season. Trying again in 1 minute");
			setTimeout(DraftBot.seasonEnd, 60000);
			return;
		}

		Settings.NEXT_SEASON_RESET.setValue(getNextSaturdayMidnight().valueOf()).then();
		draftBotInstance.logsDatabase.log15BestSeason().then();
		const winner = await DraftBot.findSeasonWinner();
		if (winner !== null) {
			PacketUtils.announce(makePacket(TopWeekFightAnnouncementPacket, { winnerKeycloakId: winner.keycloakId }), MqttTopicUtils.getDiscordTopWeekFightAnnouncementTopic(botConfig.PREFIX));
			winner.addBadge("✨");
			await winner.save();
		}
		else {
			PacketUtils.announce(makePacket(TopWeekFightAnnouncementPacket, {}), MqttTopicUtils.getDiscordTopWeekFightAnnouncementTopic(botConfig.PREFIX));
		}
		await DraftBot.seasonEndQueries();

		console.log("# WARNING # Season has been ended !");
		DraftBot.programSeasonTimeout();
		draftBotInstance.logsDatabase.logSeasonEnd().then();
	}

	/**
	 * End the top week
	 */
	static async topWeekEnd(): Promise<void> {
		draftBotInstance.logsDatabase.log15BestTopWeek().then();
		const winner = await Player.findOne({
			where: {
				weeklyScore: {
					[Op.gt]: 100
				}
			},
			order: [
				["weeklyScore", "DESC"],
				["level", "DESC"]
			],
			limit: 1
		});
		if (winner !== null) {
			PacketUtils.announce(makePacket(TopWeekAnnouncementPacket, { winnerKeycloakId: winner.keycloakId }), MqttTopicUtils.getDiscordTopWeekAnnouncementTopic(botConfig.PREFIX));
			winner.addBadge("🎗️");
			await winner.save();
		}
		else {
			PacketUtils.announce(makePacket(TopWeekAnnouncementPacket, {}), MqttTopicUtils.getDiscordTopWeekAnnouncementTopic(botConfig.PREFIX));
		}
		await Player.update({ weeklyScore: 0 }, { where: {} });
		console.log("# WARNING # Weekly leaderboard has been reset !");
		await PlayerMissionsInfo.resetShopBuyout();
		console.log("All players can now buy again points from the mission shop !");
		DraftBot.programWeeklyTimeout();
		draftBotInstance.logsDatabase.logTopWeekEnd().then();
	}

	/**
	 * Database queries to execute at the end of the season
	 * @private
	 */
	private static async seasonEndQueries(): Promise<void> {
		// We set the gloryPointsLastSeason to 0 if the fightCountdown is above the limit because the player was inactive
		await Player.update(
			{
				gloryPointsLastSeason: Sequelize.literal(
					`CASE WHEN fightCountdown <= ${FightConstants.FIGHT_COUNTDOWN_MAXIMAL_VALUE} THEN attackGloryPoints + defenseGloryPoints ELSE 0 END`
				)
			},
			{ where: {} }
		);

		// We add one to the fightCountdown
		await Player.update(
			{
				fightCountdown: Sequelize.literal(
					"fightCountdown + 1"
				)
			},
			{ where: { fightCountdown: { [Op.lt]: FightConstants.FIGHT_COUNTDOWN_REGEN_LIMIT } } }
		);

		// Transform a part of the defense glory into attack glory
		await Player.update(
			{
				defenseGloryPoints: Sequelize.literal(
					`defenseGloryPoints + LEAST(${FightConstants.ATTACK_GLORY_TO_DEFENSE_GLORY_EACH_WEEK}, attackGloryPoints)`
				),
				attackGloryPoints: Sequelize.literal(
					`attackGloryPoints - LEAST(${FightConstants.ATTACK_GLORY_TO_DEFENSE_GLORY_EACH_WEEK}, attackGloryPoints)`
				)
			},
			{ where: { attackGloryPoints: { [Op.gt]: 0 } } }
		);
	}

	/**
	 * Find the winner of the season
	 * @private
	 */
	private static async findSeasonWinner(): Promise<Player> {
		return await Player.findOne({
			where: {
				fightCountdown: {
					[Op.lte]: FightConstants.FIGHT_COUNTDOWN_MAXIMAL_VALUE
				}
			},
			order: [
				[Sequelize.literal("(attackGloryPoints + defenseGloryPoints)"), "DESC"],
				["level", "DESC"],
				["score", "DESC"]
			],
			limit: 1
		});
	}

	/**
	 * Choose a new pve island
	 */
	static async newPveIsland(): Promise<void> {
		const newMapLink = MapCache.randomPveBoatLinkId(await Settings.PVE_ISLAND.getValue());
		console.log(`New pve island map link of the week: ${newMapLink}`);
		await Settings.PVE_ISLAND.setValue(newMapLink);
	}

	/**
	 * Execute all the daily tasks
	 */
	static weeklyTimeout(): void {
		if (!PacketUtils.isMqttConnected()) {
			console.error("MQTT is not connected, can't announce the end of the week. Trying again in 1 minute");
			setTimeout(DraftBot.weeklyTimeout, 60000);
			return;
		}

		Settings.NEXT_WEEKLY_RESET.setValue(getNextSundayMidnight().valueOf()).then();
		DraftBot.topWeekEnd().then();
		DraftBot.newPveIsland().then();
	}

	static async reportNotifications(): Promise<void> {
		if (PacketUtils.isMqttConnected()) {
			const notifications = await ScheduledReportNotifications.getNotificationsBeforeDate(new Date());
			if (notifications.length !== 0) {
				PacketUtils.sendNotifications(notifications.map(notification => makePacket(ReachDestinationNotificationPacket, {
					keycloakId: notification.keycloakId,
					mapType: MapLocationDataController.instance.getById(notification.mapId).type,
					mapId: notification.mapId
				})));
				await ScheduledReportNotifications.bulkDelete(notifications);
			}
		}
		else {
			console.error(`MQTT is not connected, can't do report notifications. Trying again in ${TIMEOUT_FUNCTIONS.REPORT_NOTIFICATIONS} ms`);
		}

		setTimeout(DraftBot.reportNotifications, TIMEOUT_FUNCTIONS.REPORT_NOTIFICATIONS);
	}

	/**
	 * Sets the maintenance mode of the bot
	 * @param enable
	 * @param saveToConfig Save the maintenance state to the config file
	 * @throws
	 */
	public setMaintenance(enable: boolean, saveToConfig: boolean): void {
		// Do it before setting the maintenance mode: if it fails, the mode will not be changed
		if (saveToConfig) {
			// Read the config file
			const currentConfig = fs.readFileSync(`${process.cwd()}/config/config.toml`, "utf-8");
			const regexMaintenance = /(maintenance *= *)(true|false)/g;

			// Search for the maintenance field
			if (regexMaintenance.test(currentConfig)) {
				// Replace the value of the field. $1 is the group without true or false
				const newConfig = currentConfig.replace(regexMaintenance, `$1${enable}`);

				// Write the config
				fs.writeFileSync(`${process.cwd()}/config/config.toml`, newConfig, "utf-8");
			}
			else {
				throw new Error("Unable to get the maintenance field in the config file");
			}
		}

		botConfig.MODE_MAINTENANCE = enable;
	}

	async init(): Promise<void> {
		await registerAllPacketHandlers();
		initializeAllClassBehaviors();
		initializeAllPetBehaviors();
		await this.gameDatabase.init(true);
		await this.logsDatabase.init(true);
		await MapCache.init();
		if (botConfig.TEST_MODE) {
			await CommandsTest.init();
		}

		if (await Settings.NEXT_WEEKLY_RESET.getValue() < Date.now()) {
			DraftBot.weeklyTimeout();
		}
		else {
			DraftBot.programWeeklyTimeout();
		}

		if (await Settings.NEXT_SEASON_RESET.getValue() < Date.now()) {
			DraftBot.seasonEnd().then();
		}
		else {
			DraftBot.programSeasonTimeout();
		}

		if (await Settings.NEXT_DAILY_RESET.getValue() < Date.now()) {
			DraftBot.dailyTimeout();
		}
		else {
			DraftBot.programDailyTimeout();
		}

		DraftBot.reportNotifications().then();
	}
}
