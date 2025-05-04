import { PacketListenerServer } from "../../../../Lib/src/packets/PacketListener";
import { GameDatabase } from "../database/game/GameDatabase";
import { LogsDatabase } from "../database/logs/LogsDatabase";
import {
	botConfig, draftBotInstance
} from "../../index";
import { Settings } from "../database/game/models/Setting";
import { PetConstants } from "../../../../Lib/src/constants/PetConstants";
import {
	literal, Op, Sequelize
} from "sequelize";
import PetEntity from "../database/game/models/PetEntity";
import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";
import { PotionDataController } from "../../data/Potion";
import {
	getNextDay2AM,
	getNextSaturdayMidnight,
	getNextSundayMidnight,
	minutesToMilliseconds
} from "../../../../Lib/src/utils/TimeUtils";
import { TimeoutFunctionsConstants } from "../../../../Lib/src/constants/TimeoutFunctionsConstants";
import { MapCache } from "../maps/MapCache";
import { registerAllPacketHandlers } from "../packetHandlers/PacketHandler";
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

// skipcq: JS-C1003 - fs does not expose itself as an ES Module.
import * as fs from "fs";
import { MqttTopicUtils } from "../../../../Lib/src/utils/MqttTopicUtils";
import { initializeAllClassBehaviors } from "../fights/AiBehaviorController";
import { initializeAllPetBehaviors } from "../fights/PetAssistManager";
import { DraftBotCoreWebServer } from "./DraftBotCoreWebServer";
import { DraftBotLogger } from "../../../../Lib/src/logs/DraftBotLogger";
import { Badge } from "../../../../Lib/src/types/Badge";
import { FightsManager } from "../fights/FightsManager";

export class DraftBot {
	public readonly packetListener: PacketListenerServer;

	public readonly gameDatabase: GameDatabase;

	public readonly logsDatabase: LogsDatabase;

	private static weeklyNodeTimeout: NodeJS.Timeout;

	private static dailyNodeTimeout: NodeJS.Timeout;

	private static seasonNodeTimeout: NodeJS.Timeout;

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
	static async programWeeklyTimeout(): Promise<void> {
		const nextWeeklyReset = await Settings.NEXT_WEEKLY_RESET.getValue();
		const millisTill = nextWeeklyReset - Date.now();
		if (millisTill < TimeoutFunctionsConstants.TOP_WEEK_TIMEOUT) { // When the program weekly timeout is called after a weekly timeout, the time is 23:59:59:9xx, so if we are in this case, we wait and program the next timeout later
			setTimeout(DraftBot.programWeeklyTimeout, TimeoutFunctionsConstants.TOP_WEEK_TIMEOUT);
			return;
		}
		if (DraftBot.weeklyNodeTimeout) {
			clearTimeout(DraftBot.weeklyNodeTimeout);
			DraftBotLogger.info("Weekly timeout cleared");
		}
		DraftBot.weeklyNodeTimeout = setTimeout(DraftBot.weeklyTimeout, millisTill);
		DraftBotLogger.info("Weekly timeout set", {
			millisTill, nextWeeklyReset
		});
	}

	/**
	 * Launch the program that execute the season reset
	 */
	static async programSeasonTimeout(): Promise<void> {
		const nextSeasonReset = await Settings.NEXT_SEASON_RESET.getValue();
		const millisTill = nextSeasonReset - Date.now();
		if (millisTill < TimeoutFunctionsConstants.SEASON_TIMEOUT) { // When the program season timeout is called after a season timeout, the time is 23:59:59:9xx, so if we are in this case, we wait and program the next timeout later
			setTimeout(DraftBot.programSeasonTimeout, TimeoutFunctionsConstants.SEASON_TIMEOUT);
			return;
		}
		if (DraftBot.seasonNodeTimeout) {
			clearTimeout(DraftBot.seasonNodeTimeout);
			DraftBotLogger.info("Season timeout cleared");
		}
		DraftBot.seasonNodeTimeout = setTimeout(DraftBot.seasonEnd, millisTill);
		DraftBotLogger.info("Season timeout set", {
			millisTill, nextSeasonReset
		});
	}

	/**
	 * Launch the program that executes the daily tasks
	 */
	static async programDailyTimeout(): Promise<void> {
		const nextDailyReset = await Settings.NEXT_DAILY_RESET.getValue();
		const millisTill = nextDailyReset - Date.now();
		if (millisTill < TimeoutFunctionsConstants.DAILY_TIMEOUT) { // When the program daily timeout is called after a daily timeout, the time is 01:59:59:9xx, so if we are in this case, we wait and program the next timeout later
			setTimeout(DraftBot.programDailyTimeout, TimeoutFunctionsConstants.DAILY_TIMEOUT);
			return;
		}
		if (DraftBot.dailyNodeTimeout) {
			clearTimeout(DraftBot.dailyNodeTimeout);
			DraftBotLogger.info("Daily timeout cleared");
		}
		DraftBot.dailyNodeTimeout = setTimeout(DraftBot.dailyTimeout, millisTill);
		DraftBotLogger.info("Daily timeout set", {
			millisTill, nextDailyReset
		});
	}

	/**
	 * Execute all the daily tasks
	 */
	static async dailyTimeout(): Promise<void> {
		/*
		 * First program the daily immediately at +1 day
		 * Then wait a bit before setting the next date, so we are sure to be past the date
		 *
		 * The first one is set immediately so if the bot crashes before programming the next one, it will be set anyway to approximately a valid date (at 1s max of difference)
		 */
		await Settings.NEXT_DAILY_RESET.setValue(await Settings.NEXT_DAILY_RESET.getValue() + 24 * 60 * 60 * 1000);
		setTimeout(async () => {
			await Settings.NEXT_DAILY_RESET.setValue(getNextDay2AM().valueOf());
			await DraftBot.programDailyTimeout();
		}, TimeoutFunctionsConstants.DAILY_TIMEOUT);

		DraftBot.randomPotion()
			.finally(() => null);
		DraftBot.randomLovePointsLoose()
			.then(petLoveChange => draftBotInstance.logsDatabase.logDailyTimeout(petLoveChange)
				.then());
		draftBotInstance.logsDatabase.log15BestTopWeek()
			.then();
		await DraftBot.programDailyTimeout();
	}

	/**
	 * Update the random potion sold in the shop
	 */
	static async randomPotion(): Promise<void> {
		DraftBotLogger.info("Daily timeout");
		const previousPotionId = await Settings.SHOP_POTION.getValue();
		const newPotionId = PotionDataController.instance.randomShopPotion(previousPotionId).id;
		await Settings.SHOP_POTION.setValue(newPotionId);
		DraftBotLogger.info("New potion in shop", { newPotionId });
		draftBotInstance.logsDatabase.logDailyPotion(newPotionId)
			.then();
	}

	/**
	 * Make some pet lose some love points
	 */
	static async randomLovePointsLoose(): Promise<boolean> {
		if (RandomUtils.draftbotRandom.bool()) {
			DraftBotLogger.info("All pets lost 4 loves point");
			await PetEntity.update(
				{
					lovePoints: literal(
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
	 * End the fight season
	 */
	static async seasonEnd(): Promise<void> {
		if (!PacketUtils.isMqttConnected()) {
			DraftBotLogger.error("MQTT is not connected, can't announce the end of the season. Trying again in 1 minute");
			setTimeout(DraftBot.seasonEnd, 60000);
			return;
		}

		/*
		 * First program the next season end immediately at +7 days
		 * Then wait a bit before setting the next date, so we are sure to be past the date
		 *
		 * The first one is set immediately so if the bot crashes before programming the next one, it will be set anyway to approximately a valid date (at 1s max of difference)
		 */
		await Settings.NEXT_SEASON_RESET.setValue(await Settings.NEXT_SEASON_RESET.getValue() + 7 * 24 * 60 * 60 * 1000);
		setTimeout(async () => {
			await Settings.NEXT_SEASON_RESET.setValue(getNextSaturdayMidnight());
			await DraftBot.programSeasonTimeout();
		}, TimeoutFunctionsConstants.SEASON_TIMEOUT);

		draftBotInstance.logsDatabase.log15BestSeason()
			.then();
		const winner = await DraftBot.findSeasonWinner();
		if (winner !== null) {
			PacketUtils.announce(makePacket(TopWeekFightAnnouncementPacket, { winnerKeycloakId: winner.keycloakId }), MqttTopicUtils.getDiscordTopWeekFightAnnouncementTopic(botConfig.PREFIX));
			winner.addBadge(Badge.TOP_GLORY);
			await winner.save();
		}
		else {
			PacketUtils.announce(makePacket(TopWeekFightAnnouncementPacket, {}), MqttTopicUtils.getDiscordTopWeekFightAnnouncementTopic(botConfig.PREFIX));
		}
		await DraftBot.seasonEndQueries();

		DraftBotLogger.info("Season has been ended !");
		await DraftBot.programSeasonTimeout();
		draftBotInstance.logsDatabase.logSeasonEnd()
			.then();
	}

	/**
	 * End the top week
	 */
	static async topWeekEnd(): Promise<void> {
		draftBotInstance.logsDatabase.log15BestTopWeek()
			.then();
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
			winner.addBadge(Badge.TOP_WEEK);
			await winner.save();
		}
		else {
			PacketUtils.announce(makePacket(TopWeekAnnouncementPacket, {}), MqttTopicUtils.getDiscordTopWeekAnnouncementTopic(botConfig.PREFIX));
		}
		await Player.update({ weeklyScore: 0 }, { where: {} });
		DraftBotLogger.info("Weekly leaderboard has been reset !");
		await PlayerMissionsInfo.resetShopBuyout();
		DraftBotLogger.info("All players can now buy again points from the mission shop !");
		await DraftBot.programWeeklyTimeout();
		draftBotInstance.logsDatabase.logTopWeekEnd()
			.then();
	}

	/**
	 * Database queries to execute at the end of the season
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
		DraftBotLogger.info("New pve island map link of the week", { newMapLink });
		await Settings.PVE_ISLAND.setValue(newMapLink);
	}

	/**
	 * Update the fight points of the entities that lost some
	 */
	static fightPowerRegenerationLoop(): void {
		Player.update(
			{
				fightPointsLost: Sequelize.literal(
					`CASE WHEN fightPointsLost - ${FightConstants.POINTS_REGEN_AMOUNT} < 0 THEN 0 ELSE fightPointsLost - ${FightConstants.POINTS_REGEN_AMOUNT} END`
				)
			},
			{
				where: {
					fightPointsLost: { [Op.not]: 0 },
					mapLinkId: { [Op.in]: MapCache.regenEnergyMapLinks }
				}
			}
		)
			.finally(() => null);
		setTimeout(
			DraftBot.fightPowerRegenerationLoop,
			minutesToMilliseconds(FightConstants.POINTS_REGEN_MINUTES)
		);
	}

	/**
	 * Execute all the daily tasks
	 */
	static async weeklyTimeout(): Promise<void> {
		if (!PacketUtils.isMqttConnected()) {
			DraftBotLogger.error("MQTT is not connected, can't announce the end of the week. Trying again in 1 minute");
			setTimeout(DraftBot.weeklyTimeout, 60000);
			return;
		}

		/*
		 * First program the next weekly end immediately at +7 days
		 * Then wait a bit before setting the next date, so we are sure to be past the date
		 *
		 * The first one is set immediately so if the bot crashes before programming the next one, it will be set anyway to approximately a valid date (at 1s max of difference)
		 */
		await Settings.NEXT_WEEKLY_RESET.setValue(await Settings.NEXT_WEEKLY_RESET.getValue() + 7 * 24 * 60 * 60 * 1000);
		setTimeout(async () => {
			await Settings.NEXT_WEEKLY_RESET.setValue(getNextSundayMidnight());
			await DraftBot.programWeeklyTimeout();
		}, TimeoutFunctionsConstants.TOP_WEEK_TIMEOUT);

		DraftBot.topWeekEnd()
			.then();
		DraftBot.newPveIsland()
			.then();
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
			DraftBotLogger.error(`MQTT is not connected, can't do report notifications. Trying again in ${TimeoutFunctionsConstants.REPORT_NOTIFICATIONS} ms`);
		}

		setTimeout(DraftBot.reportNotifications, TimeoutFunctionsConstants.REPORT_NOTIFICATIONS);
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
		DraftBotCoreWebServer.start();
		await registerAllPacketHandlers();
		initializeAllClassBehaviors();
		initializeAllPetBehaviors();
		await this.gameDatabase.init(true);
		await this.logsDatabase.init(true);
		await MapCache.init();
		FightsManager.init();
		if (botConfig.TEST_MODE) {
			await CommandsTest.init();
		}

		if (await Settings.NEXT_WEEKLY_RESET.getValue() < Date.now()) {
			DraftBot.weeklyTimeout()
				.then();
		}
		else {
			DraftBot.programWeeklyTimeout()
				.then();
		}

		if (await Settings.NEXT_SEASON_RESET.getValue() < Date.now()) {
			DraftBot.seasonEnd()
				.then();
		}
		else {
			DraftBot.programSeasonTimeout()
				.then();
		}

		if (await Settings.NEXT_DAILY_RESET.getValue() < Date.now()) {
			DraftBot.dailyTimeout()
				.then();
		}
		else {
			DraftBot.programDailyTimeout()
				.then();
		}

		DraftBot.reportNotifications()
			.then();

		setTimeout(
			DraftBot.fightPowerRegenerationLoop,
			minutesToMilliseconds(FightConstants.POINTS_REGEN_MINUTES)
		);
	}
}
