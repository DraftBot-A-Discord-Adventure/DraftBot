import {DraftBotConfig} from "./DraftBotConfig";
import {Constants} from "../Constants";
import {Client, TextChannel} from "discord.js";
import {DraftBotBackup} from "../backup/DraftBotBackup";
import {TranslationModule, Translations} from "../Translations";
import * as fs from "fs";
import {botConfig, draftBotClient, shardId} from "./index";

require("colors");
require("../Constant");
require("../MessageError");
require("../Tools");

// TODO refactor when TimeUtils will be merged
declare const getNextSundayMidnight: () => Date;
// TODO refactor when TimeUtils will be merged
declare const getNextDay2AM: () => Date;
// TODO refactor when new models will be merged
declare const Shop: any;
// TODO refactor when new models will be merged
declare const Potions: any;
// TODO refactor when new random will be merged
declare const draftbotRandom: any;
// TODO refactor when new models will be merged
declare const PetEntities: any;
// TODO refactor when new models will be merged
declare const Entities: any;
// TODO refactor when new models will be merged
declare const Players: any;

export class DraftBot {
	private config: DraftBotConfig;

	private currLogsFile: string;

	private readonly isMainShard: boolean;

	private currLogsCount: number;

	public readonly client: Client;

	constructor(client: Client, config: DraftBotConfig, isMainShard: boolean) {
		this.client = client;
		this.config = config;
		this.isMainShard = isMainShard;
	}

	async init() {
		this.handleLogs();

		await require("../JsonReader").init({
			folders: ["resources/text/commands", "resources/text/models", "resources/text/smallEvents"],
			files: [
				"config/app.json",
				"draftbot/package.json",
				"resources/text/error.json",
				"resources/text/bot.json",
				"resources/text/classesValues.json",
				"resources/text/advices.json",
				"resources/text/smallEventsIntros.json",
				"resources/text/values.json",
				"resources/text/items.json",
				"resources/text/food.json"
			]
		});
		await require("../Database").init(this.isMainShard);
		await require("../Command").init();
		await require("../fights/Attack").init();
		if (this.config.TEST_MODE === true) {
			await require("../CommandsTest").init();
		}

		if (this.isMainShard) { // Do this only if it's the main shard
			await DraftBotBackup.init();
			DraftBot.programTopWeekTimeout();
			DraftBot.programDailyTimeout();
			setTimeout(
				DraftBot.fightPowerRegenerationLoop,
				Constants.FIGHT.POINTS_REGEN_MINUTES * 60 * 1000
			);
		}
	}

	static programTopWeekTimeout() {
		const millisTill = getNextSundayMidnight().getTime() - Date.now();
		if (millisTill === 0) {
			// Case at 0:00:00
			setTimeout(this.programTopWeekTimeout, 10000);
			return;
		}
		setTimeout(this.topWeekEnd, millisTill);
	}

	static programDailyTimeout() {
		const millisTill = getNextDay2AM().getTime() - Date.now();
		if (millisTill === 0) {
			// Case at 2:00:00
			setTimeout(this.programDailyTimeout, 10000);
			return;
		}
		setTimeout(this.dailyTimeout, millisTill);
	}

	static dailyTimeout() {
		this.randomPotion();
		this.randomLovePointsLoose();
		this.programDailyTimeout();
	}

	static async randomPotion() {
		const sequelize = require("sequelize");
		console.log("INFO: Daily timeout");
		const shopPotion = await Shop.findOne({
			attributes: ["shopPotionId"]
		});
		let potion;

		potion = await Potions.findAll({
			order: sequelize.literal("random()")
		});
		let i = 0;
		while (potion[i].id === shopPotion.shopPotionId || potion[i].nature === Constants.NATURE.NONE || potion[i].rarity >= Constants.RARITY.LEGENDARY) {
			i++;
		} potion = potion[i];

		await Shop.update(
			{
				shopPotionId: potion.id
			},
			{
				where: {
					shopPotionId: {
						[sequelize.Op.col]: "shop.shopPotionId"
					}
				}
			}
		);
		console.info(`INFO : new potion in shop : ${potion.id}`);
	}

	static async randomLovePointsLoose() {
		const sequelize = require("sequelize");
		if (draftbotRandom.bool()) {
			console.log("INFO: All pets lost 4 loves point");
			await PetEntities.update(
				{
					lovePoints: sequelize.literal(
						"CASE WHEN lovePoints - 1 < 0 THEN 0 ELSE lovePoints - 4 END"
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
		}
	}

	static async topWeekEnd() {
		const winner = await Entities.findOne({
			defaults: {
				Player: {
					Inventory: {}
				}
			},
			include: [
				{
					model: Players,
					as: "Player",
					where: {
						weeklyScore: {
							[require("sequelize/lib/operators").gt]: 100
						}
					}
				}
			],
			order: [
				[{model: Players, as: "Player"}, "weeklyScore", "DESC"],
				[{model: Players, as: "Player"}, "level", "DESC"]
			],
			limit: 1
		});
		if (winner !== null) {
			await draftBotClient.shard.broadcastEval(async (client, context: { config: DraftBotConfig, frSentence: string, enSentence: string }) => {
				const guild = client.guilds.cache.get(context.config.MAIN_SERVER_ID);
				try {
					const message = await (await guild.channels.fetch(context.config.FRENCH_ANNOUNCEMENT_CHANNEL_ID) as TextChannel).send({
						content: context.frSentence
					});
					await message.react("🏆");
				}
				catch {
					// Ignore
				}
				try {
					const message = await (await guild.channels.fetch(context.config.ENGLISH_ANNOUNCEMENT_CHANNEL_ID) as TextChannel).send({
						content: context.enSentence
					});
					await message.react("🏆");
				}
				catch {
					// Ignore
				}
			}, {
				context: {
					config: botConfig,
					frSentence: Translations.getModule("bot", "fr").format("topWeekAnnouncement", {
						mention: winner.getMention()
					}),
					enSentence: Translations.getModule("bot", "en").format("topWeekAnnouncement", {
						mention: winner.getMention()
					})
				}
			});
			winner.Player.addBadge("🎗️");
			winner.Player.save();
		}
		Players.update({weeklyScore: 0}, {where: {}});
		console.log("# WARNING # Weekly leaderboard has been reset !");
		this.programTopWeekTimeout();
	}

	static async fightPowerRegenerationLoop() {
		const sequelize = require("sequelize");
		await Entities.update(
			{
				fightPointsLost: sequelize.literal(
					`CASE WHEN fightPointsLost - ${Constants.FIGHT.POINTS_REGEN_AMOUNT} < 0 THEN 0 ELSE fightPointsLost - ${Constants.FIGHT.POINTS_REGEN_AMOUNT} END`
				)
			},
			{where: {fightPointsLost: {[sequelize.Op.not]: 0}}}
		);
		setTimeout(
			this.fightPowerRegenerationLoop,
			Constants.FIGHT.POINTS_REGEN_MINUTES * 60 * 1000
		);
	}

	updateGlobalLogsFile(now: Date) {
		/* Find first available log file */
		let i = 1;
		do {
			this.currLogsFile =
				"logs/logs-" +
				now.getFullYear() +
				"-" +
				("0" + (now.getMonth() + 1)).slice(-2) +
				"-" +
				("0" + now.getDate()).slice(-2) +
				"-shard-" + shardId + "-" +
				("0" + i).slice(-2) +
				".txt";
			i++;
		} while (fs.existsSync(this.currLogsFile));
	}

	handleLogs() {
		const now = Date.now();
		const originalConsoleLog = console.log;

		/* Create log folder and remove old logs (> 7 days) */
		if (!fs.existsSync("logs")) {
			fs.mkdirSync("logs");
		}
		else {
			fs.readdir("logs", function(err, files) {
				if (err) {
					return;
				}
				files.forEach(function(file) {
					const parts = file.split("-");
					if (parts.length === 5) {
						if (
							now -
							new Date(
								parseInt(parts[1]),
								parseInt(parts[2]) - 1,
								parseInt(parts[3])
							).getTime() >
							7 * 24 * 60 * 60 * 1000
						) {
							// 7 days
							fs.unlink("logs/" + file, function(err: Error) {
								if (err !== undefined && err !== null) {
									originalConsoleError(
										"Error while deleting logs/" +
										file +
										": " +
										err
									);
								}
							});
						}
					}
				});
			});
		}

		this.updateGlobalLogsFile(new Date());
		this.currLogsCount = 0;

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const thisInstance = this;

		/* Add log to file */
		const addConsoleLog = function(message: any) {
			if (!message) {
				return;
			}
			const now = new Date();
			const dateStr =
				"[" +
				now.getFullYear() +
				"/" +
				("0" + (now.getMonth() + 1)).slice(-2) +
				"/" +
				("0" + now.getDate()).slice(-2) +
				" " +
				("0" + now.getHours()).slice(-2) +
				":" +
				("0" + now.getMinutes()).slice(-2) +
				":" +
				("0" + now.getSeconds()).slice(-2) +
				"] ";
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
				console.error("Cannot write to log file: " + e);
			}
		};

		/* Console override */
		console.log = function(message, optionalParams) {
			addConsoleLog(message);
			originalConsoleLog(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleWarn = console.warn;
		console.warn = function(message, optionalParams) {
			addConsoleLog(message);
			originalConsoleWarn(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleInfo = console.info;
		console.info = function(message, optionalParams) {
			addConsoleLog(message);
			originalConsoleInfo(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleDebug = console.debug;
		console.debug = function(message, optionalParams) {
			addConsoleLog(message);
			originalConsoleDebug(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleError = console.error;
		console.error = function(message, optionalParams) {
			addConsoleLog(message);
			originalConsoleError(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleTrace = console.trace;
		console.trace = function(message, optionalParams) {
			addConsoleLog(message);
			originalConsoleTrace(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		global.log = addConsoleLog;
	}
}
