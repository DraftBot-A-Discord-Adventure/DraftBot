import Potion from "../database/game/models/Potion";
import PetEntity from "../database/game/models/PetEntity";
import Player from "../database/game/models/Player";
import PlayerMissionsInfo from "../database/game/models/PlayerMissionsInfo";
import {DraftBotConfig} from "./DraftBotConfig";
import {Constants} from "../Constants";
import {Client, TextChannel} from "discord.js";
import {checkMissingTranslations, Translations} from "../Translations";
import * as fs from "fs";
import {botConfig, draftBotClient, draftBotInstance, shardId} from "./index";
import Shop from "../database/game/models/Shop";
import {RandomUtils} from "../utils/RandomUtils";
import Entity from "../database/game/models/Entity";
import {CommandsManager} from "../../commands/CommandsManager";
import {getNextDay2AM, getNextSundayMidnight, minutesToMilliseconds} from "../utils/TimeUtils";
import {GameDatabase} from "../database/game/GameDatabase";
import {Op, Sequelize} from "sequelize";
import {LogsDatabase} from "../database/logs/LogsDatabase";
import {CommandsTest} from "../CommandsTest";

/**
 * The main class of the bot, manages the bot in general
 */
export class DraftBot {
	public readonly client: Client;

	public readonly gameDatabase: GameDatabase;

	public readonly logsDatabase: LogsDatabase;

	private config: DraftBotConfig;

	private currLogsFile: string;

	private readonly isMainShard: boolean;

	private currLogsCount: number;

	constructor(client: Client, config: DraftBotConfig, isMainShard: boolean) {
		this.client = client;
		this.config = config;
		this.isMainShard = isMainShard;
		this.gameDatabase = new GameDatabase();
		this.logsDatabase = new LogsDatabase();
	}

	/**
	 * launch the program that execute the top week reset
	 */
	static programTopWeekTimeout(this: void): void {
		const millisTill = getNextSundayMidnight().valueOf() - Date.now();
		if (millisTill === 0) {
			// Case at 0:00:00
			setTimeout(DraftBot.programTopWeekTimeout, 10000);
			return;
		}
		setTimeout(DraftBot.topWeekEnd, millisTill);
	}

	/**
	 * launch the program that execute the daily tasks
	 */
	static programDailyTimeout(this: void): void {
		const millisTill = getNextDay2AM().valueOf() - Date.now();
		if (millisTill === 0) {
			// Case at 2:00:00
			setTimeout(DraftBot.programDailyTimeout, 10000);
			return;
		}
		setTimeout(DraftBot.dailyTimeout, millisTill);
	}

	/**
	 * execute all the daily tasks
	 */
	static dailyTimeout(this: void): void {
		DraftBot.randomPotion().finally(() => null);
		DraftBot.randomLovePointsLoose().then((petLoveChange) => draftBotInstance.logsDatabase.logDailyTimeout(petLoveChange).then());
		draftBotInstance.logsDatabase.log15BestTopWeek().then();
		DraftBot.programDailyTimeout();
	}

	/**
	 * update the random potion sold in the shop
	 */
	static async randomPotion(): Promise<void> {
		console.log("INFO: Daily timeout");
		const shopPotion = await Shop.findOne({
			attributes: ["shopPotionId"]
		});
		Potion.findAll({
			where: {
				nature: {
					[Op.ne]: Constants.NATURE.NONE
				},
				rarity: {
					[Op.lt]: Constants.RARITY.LEGENDARY
				}
			},
			order: Sequelize.literal("rand()")
		}).then(async potions => {
			let potionId: number;
			if (shopPotion) {
				potionId = potions[potions[0].id === shopPotion.shopPotionId ? 1 : 0].id;
				await Shop.update(
					{
						shopPotionId: potionId
					},
					{
						where: {
							shopPotionId: {
								[Op.col]: "shop.shopPotionId"
							}
						}
					}
				);
			}
			else {
				potionId = potions[0].id;
				console.log("WARN : no potion in shop");
				await Shop.create(
					{
						shopPotionId: potions[0].id
					}
				);
			}
			console.info(`INFO : new potion in shop : ${potionId}`);
			draftBotInstance.logsDatabase.logDailyPotion(potionId).then();
		});
	}

	/**
	 * make some pet lose some love points
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
							[sequelize.Op.not]: Constants.PETS.MAX_LOVE_POINTS
						}
					}
				}
			);
			return true;
		}
		return false;
	}

	/**
	 * End the top week
	 */
	static async topWeekEnd(this: void): Promise<void> {
		draftBotInstance.logsDatabase.log15BestTopWeek().then();
		const winner = await Entity.findOne({
			include: [
				{
					model: Player,
					as: "Player",
					where: {
						weeklyScore: {
							[require("sequelize/lib/operators").gt]: 100
						}
					}
				}
			],
			order: [
				[{model: Player, as: "Player"}, "weeklyScore", "DESC"],
				[{model: Player, as: "Player"}, "level", "DESC"]
			],
			limit: 1
		});
		if (winner !== null) {
			await draftBotClient.shard.broadcastEval((client, context: { config: DraftBotConfig, frSentence: string, enSentence: string }) => {
				client.guilds.fetch(context.config.MAIN_SERVER_ID).then((guild) => {
					if (guild.shard) {
						try {
							guild.channels.fetch(context.config.FRENCH_ANNOUNCEMENT_CHANNEL_ID).then(channel => {
								(channel as TextChannel).send({
									content: context.frSentence
								}).then(message => {
									message.react("🏆").then();
								});
							});
						}
						catch (e) {
							console.log(e);
						}
						try {
							guild.channels.fetch(context.config.ENGLISH_ANNOUNCEMENT_CHANNEL_ID).then(channel => {
								(channel as TextChannel).send({
									content: context.enSentence
								}).then(message => {
									message.react("🏆").then();
								});
							});
						}
						catch (e) {
							console.log(e);
						}
					}
				});
			}, {
				context: {
					config: botConfig,
					frSentence: Translations.getModule("bot", Constants.LANGUAGE.FRENCH).format("topWeekAnnouncement", {
						mention: winner.getMention()
					}),
					enSentence: Translations.getModule("bot", Constants.LANGUAGE.ENGLISH).format("topWeekAnnouncement", {
						mention: winner.getMention()
					})
				}
			});
			winner.Player.addBadge("🎗️");
			await winner.Player.save();
		}
		await Player.update({weeklyScore: 0}, {where: {}});
		console.log("# WARNING # Weekly leaderboard has been reset !");
		await PlayerMissionsInfo.resetShopBuyout();
		console.log("All players can now buy again points from the mission shop !");
		DraftBot.programTopWeekTimeout();
		draftBotInstance.logsDatabase.logTopWeekEnd().then();
	}

	/**
	 * update the fight points of the entities that lost some
	 */
	static fightPowerRegenerationLoop(this: void): void {
		Entity.update(
			{
				fightPointsLost: Sequelize.literal(
					`CASE WHEN fightPointsLost - ${Constants.FIGHT.POINTS_REGEN_AMOUNT} < 0 THEN 0 ELSE fightPointsLost - ${Constants.FIGHT.POINTS_REGEN_AMOUNT} END`
				)
			},
			{where: {fightPointsLost: {[Op.not]: 0}}}
		).finally(() => null);
		setTimeout(
			DraftBot.fightPowerRegenerationLoop,
			minutesToMilliseconds(Constants.FIGHT.POINTS_REGEN_MINUTES)
		);
	}

	/**
	 * initialize the bot
	 */
	async init(): Promise<void> {
		this.handleLogs();

		await require("../JsonReader").init({
			folders: [
				"resources/text/commands",
				"resources/text/models",
				"resources/text/smallEvents",
				"resources/text/missions",
				"resources/text/messages",
				"resources/text/fightactions",
				"resources/text/classes"
			],
			files: [
				"draftbot/package.json",
				"resources/text/error.json",
				"resources/text/bot.json",
				"resources/text/advices.json",
				"resources/text/smallEventsIntros.json",
				"resources/text/items.json",
				"resources/text/food.json",
				"resources/text/campaign.json"
			]
		});
		await this.gameDatabase.init(this.isMainShard);
		await this.logsDatabase.init(this.isMainShard);
		await CommandsManager.register(draftBotClient, this.isMainShard);
		if (this.config.TEST_MODE === true) {
			await CommandsTest.init();
		}

		if (this.isMainShard) { // Do this only if it's the main shard
			DraftBot.programTopWeekTimeout();
			DraftBot.programDailyTimeout();
			setTimeout(
				DraftBot.fightPowerRegenerationLoop.bind(DraftBot),
				minutesToMilliseconds(Constants.FIGHT.POINTS_REGEN_MINUTES)
			);
			checkMissingTranslations();
		}
	}

	/**
	 * Updates the global log files
	 * @param now
	 */
	updateGlobalLogsFile(now: Date): void {
		/* Find first available log file */
		let i = 1;
		do {
			this.currLogsFile =
				`logs/logs-${now.getFullYear()}-${`0${now.getMonth() + 1}`.slice(-2)}-${`0${now.getDate()}`.slice(-2)}-shard-${shardId}-${`0${i}`.slice(-2)}.txt`;
			i++;
		} while (fs.existsSync(this.currLogsFile));
	}

	/**
	 * Handle the managment of the logs
	 */
	handleLogs(): void {
		const originalConsoleError = console.error;

		if (this.isMainShard) {
			this.manageLogs(originalConsoleError);
		}

		this.updateGlobalLogsFile(new Date());
		this.currLogsCount = 0;

		const addConsoleLog = this.functionToAddLogToFile(this);

		this.overwriteGlobalLogs(addConsoleLog, originalConsoleError);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		global.log = addConsoleLog;
	}

	/**
	 * Overwrite the global logs of typescript
	 * @param addConsoleLog
	 * @param originalConsoleError
	 * @private
	 */
	private overwriteGlobalLogs(addConsoleLog: (message: string) => void, originalConsoleError: (...data: unknown[]) => void): void {
		/* Console override */
		const originalConsoleLog = console.log;
		const originalConsoleWarn = console.warn;
		const originalConsoleInfo = console.info;
		const originalConsoleDebug = console.debug;
		const originalConsoleTrace = console.trace;
		console.log = this.getLogEquivalent(addConsoleLog, originalConsoleLog);
		console.warn = this.getLogEquivalent(addConsoleLog, originalConsoleWarn);
		console.info = this.getLogEquivalent(addConsoleLog, originalConsoleInfo);
		console.debug = this.getLogEquivalent(addConsoleLog, originalConsoleDebug);
		console.error = this.getLogEquivalent(addConsoleLog, originalConsoleError);
		console.trace = this.getLogEquivalent(addConsoleLog, originalConsoleTrace);
	}

	/**
	 * Get the equivalent function for a given type of log
	 * @param addConsoleLog
	 * @param originalConsoleX
	 * @private
	 */
	private getLogEquivalent(addConsoleLog: (message: string) => void, originalConsoleX: (...data: unknown[]) => void) {
		return function(message: string, optionalParams: (...data: unknown[]) => void): void {
			if (message === "(sequelize) Warning: Unknown attributes (Player) passed to defaults option of findOrCreate") {
				return;
			}
			addConsoleLog(message);
			originalConsoleX(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
	}

	/**
	 * Get the function to add log to the logfile
	 * @param thisInstance
	 * @private
	 */
	private functionToAddLogToFile(thisInstance: this) {
		return function(message: string): void {
			if (!message) {
				return;
			}
			const now = new Date();
			// eslint-disable-next-line max-len
			const dateStr = `[${now.getFullYear()}/${`0${now.getMonth() + 1}`.slice(-2)}/${`0${now.getDate()}`.slice(-2)} ${`0${now.getHours()}`.slice(-2)}:${`0${now.getMinutes()}`.slice(-2)}:${`0${now.getSeconds()}`.slice(-2)}] `;
			try {
				fs.appendFileSync(
					thisInstance.currLogsFile,
					dateStr +
					message/*
					 // TODO sera remplacé par un vrai système de logs next maj
					 .replace(
						// eslint-disable-next-line no-control-regex
						/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
						""
					)*/ +
					"\n"
				);
				thisInstance.currLogsCount++;
				if (thisInstance.currLogsCount > Constants.LOGS.LOG_COUNT_LINE_LIMIT) {
					thisInstance.updateGlobalLogsFile(now);
					thisInstance.currLogsCount = 0;
				}
			}
			catch (e) {
				console.error(`Cannot write to log file: ${e}`);
			}
		};
	}

	/**
	 * Manage the logfiles
	 * @param originalConsoleError
	 * @private
	 */
	private manageLogs(originalConsoleError: (...data: unknown[]) => void): void {
		/* Create log folder and remove old logs (> 7 days) */
		if (!fs.existsSync("logs")) {
			fs.mkdirSync("logs");
		}
		else {
			fs.readdir("logs", this.removeOlderLogs(originalConsoleError));
		}
	}

	/**
	 * Remove the older logfiles to free space
	 * @param originalConsoleError
	 * @private
	 */
	private removeOlderLogs(originalConsoleError: (...data: unknown[]) => void) {
		return function(err: NodeJS.ErrnoException, files: string[]): void {
			if (err) {
				return;
			}
			files.forEach(function(file) {
				const parts = file.split("-");
				if (parts.length >= 5) {
					if (
						Date.now() -
						new Date(
							parseInt(parts[1], 10),
							parseInt(parts[2], 10) - 1,
							parseInt(parts[3], 10)
						).valueOf() >
						7 * 24 * 60 * 60 * 1000
					) {
						// 7 days
						fs.unlink(`logs/${file}`, function(err: Error) {
							if (err !== undefined && err !== null) {
								originalConsoleError(
									`Error while deleting logs/${file}: ${err.toString()}`
								);
							}
						});
					}
				}
			});
		};
	}
}
