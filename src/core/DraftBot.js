const fs = require("fs");

/**
 * @class
 */
class DraftBot {
	/**
	 * @return {Promise<DraftBot>}
	 */
	static async init() {
		DraftBot.handleLogs();

		await require("core/JsonReader").init({
			folders: ["resources/text/commands", "resources/text/models", "resources/text/small_events"],
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
			],
		});
		await require("core/Database").init();
		await require("core/Command").init();
		await require("core/fights/Attack").init();

		// TODO
		// draftbot.checkEasterEggsFile();

		DraftBot.programTopWeekTimeout();
		DraftBot.programDailyTimeout();
		setTimeout(
			DraftBot.fightPowerRegenerationLoop,
			FIGHT.POINTS_REGEN_MINUTES * 60 * 1000
		);

		require("core/DBL").startDBLWebhook();

		return this;
	}

	/**
	 * Programs a timeout for the next sunday midnight
	 */
	static programTopWeekTimeout() {
		let millisTill = getNextSundayMidnight() - new Date();
		if (millisTill === 0) {
			//Case at 0:00:00
			setTimeout(DraftBot.programTopWeekTimeout, 10000);
			return;
		}
		setTimeout(DraftBot.topWeekEnd, millisTill);
	}

	/**
	 * Programs a timeout for the next day
	 */
	static programDailyTimeout() {
		let millisTill = getNextDay2AM() - new Date();
		if (millisTill === 0) {
			//Case at 2:00:00
			setTimeout(DraftBot.programDailyTimeout, 10000);
			return;
		}
		setTimeout(DraftBot.dailyTimeout, millisTill);
	}

	/**
	 * Daily timeout actions
	 */
	static dailyTimeout() {
		DraftBot.randomPotion();
		DraftBot.randomLovePointsLoose();
		DraftBot.programDailyTimeout();
	}

	static async randomPotion() {
		const sequelize = require("sequelize");
		console.log("INFO: Daily timeout");
		const shopPotion = await Shop.findOne({
			attributes: ["shop_potion_id"],
		});
		let potion;
		
		potion = await Potions.findAll({
			order: sequelize.literal("random()"),
		});
		let i = 0;
		while (potion[i].id === shopPotion.shop_potion_id || potion[i].nature === NATURE.NONE || potion[i].rarity >= RARITY.LEGENDARY) {
			i++;
		} potion = potion[i];

		await Shop.update(
			{
				shop_potion_id: potion.id,
			},
			{
				where: {
					shop_potion_id: {
						[sequelize.Op.col]: "shop.shop_potion_id",
					},
				},
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
					),
				},
				{
					where: {
						lovePoints: {
							[sequelize.Op.not]: PETS.MAX_LOVE_POINTS,
						},
					},
				}
			);
		}
	}
	/**
	 * Handle the top week reward and reset
	 * @return {Promise<void>}
	 */
	static async topWeekEnd() {
		let winner = await Entities.findOne({
			defaults: {
				Player: {
					Inventory: {},
				},
			},
			include: [
				{
					model: Players,
					as: "Player",
					where: {
						weeklyScore: {
							[require("sequelize/lib/operators").gt]: 100,
						},
					},
				},
			],
			order: [
				[{model: Players, as: "Player"}, "weeklyScore", "DESC"],
				[{model: Players, as: "Player"}, "level", "DESC"],
			],
			limit: 1,
		});
		if (winner !== null) {
			let message;
			try {
				message = await (
					await client.channels.fetch(
						JsonReader.app.FRENCH_ANNOUNCEMENT_CHANNEL_ID
					)
				).send(
					format(
						JsonReader.bot.getTranslation("fr").topWeekAnnouncement,
						{mention: winner.getMention()}
					)
				);
				await message.react("🏆");
			} catch (e) {
				log("No channel for french announcement !");
			}
			try {
				message = await (
					await client.channels.fetch(
						JsonReader.app.ENGLISH_ANNOUNCEMENT_CHANNEL_ID
					)
				).send(
					format(
						JsonReader.bot.getTranslation("en").topWeekAnnouncement,
						{mention: winner.getMention()}
					)
				);
				await message.react("🏆");
			} catch (e) {
				log("No channel for english announcement !");
			}
			winner.Player.addBadge("🎗️");
			winner.Player.save();
		}
		Players.update({weeklyScore: 0}, {where: {}});
		console.log("# WARNING # Weekly leaderboard has been reset !");
		DraftBot.programTopWeekTimeout();
	}

	static async fightPowerRegenerationLoop() {
		const sequelize = require("sequelize");
		await Entities.update(
			{
				fightPointsLost: sequelize.literal(
					`CASE WHEN fightPointsLost - ${FIGHT.POINTS_REGEN_AMOUNT} < 0 THEN 0 ELSE fightPointsLost - ${FIGHT.POINTS_REGEN_AMOUNT} END`
				),
			},
			{where: {fightPointsLost: {[sequelize.Op.not]: 0}}}
		);
		setTimeout(
			DraftBot.fightPowerRegenerationLoop,
			FIGHT.POINTS_REGEN_MINUTES * 60 * 1000
		);
	}

	static updateGlobalLogsFile(now) {
		/* Find first available log file */
		let i = 1;
		do {
			global.currLogsFile =
				"logs/logs-" +
				now.getFullYear() +
				"-" +
				("0" + (now.getMonth() + 1)).slice(-2) +
				"-" +
				("0" + now.getDate()).slice(-2) +
				"-" +
				("0" + i).slice(-2) +
				".txt";
			i++;
		} while (fs.existsSync(global.currLogsFile));
	}

	static handleLogs() {
		const now = new Date();
		const originalConsoleLog = console.log;

		/* Create log folder and remove old logs (> 7 days) */
		if (!fs.existsSync("logs")) {
			fs.mkdirSync("logs");
		} else {
			fs.readdir("logs", function (err, files) {
				if (err) {
					return message.author.send(
						"```Unable to scan directory: " + err + "```"
					);
				}
				files.forEach(function (file) {
					const parts = file.split("-");
					if (parts.length === 5) {
						if (
							now -
							new Date(
								parseInt(parts[1]),
								parseInt(parts[2]) - 1,
								parseInt(parts[3])
							) >
							7 * 24 * 60 * 60 * 1000
						) {
							// 7 days
							fs.unlink("logs/" + file, function (err) {
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

		DraftBot.updateGlobalLogsFile(now);
		global.currLogsCount = 0;

		/* Add log to file */
		const addConsoleLog = function (message) {
			let now = new Date();
			let dateStr =
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
					global.currLogsFile,
					dateStr +
					message.replace(
						// eslint-disable-next-line no-control-regex
						/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
						""
					) +
					"\n",
					new function (err) {
						if (err !== undefined) {
							originalConsoleError(
								"Error while writing in log file: " + err
							);
						}
					}()
				);
				global.currLogsCount++;
				if (global.currLogsCount > LOGS.LOG_COUNT_LINE_LIMIT) {
					DraftBot.updateGlobalLogsFile(now);
					global.currLogsCount = 0;
				}
			} catch (e) {
				console.error("Cannot write to log file: " + e);
			}
		};

		/* Console override */
		console.log = function (message, optionalParams) {
			addConsoleLog(message);
			originalConsoleLog(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleWarn = console.warn;
		console.warn = function (message, optionalParams) {
			addConsoleLog(message);
			originalConsoleWarn(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleInfo = console.info;
		console.info = function (message, optionalParams) {
			addConsoleLog(message);
			originalConsoleInfo(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleDebug = console.debug;
		console.debug = function (message, optionalParams) {
			addConsoleLog(message);
			originalConsoleDebug(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleError = console.error;
		console.error = function (message, optionalParams) {
			addConsoleLog(message);
			originalConsoleError(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};
		const originalConsoleTrace = console.trace;
		console.trace = function (message, optionalParams) {
			addConsoleLog(message);
			originalConsoleTrace(
				message,
				optionalParams === undefined ? "" : optionalParams
			);
		};

		global.log = addConsoleLog;
	}

	/**
	 * TODO
	 * Checks if the easter eggs file exists and copy the default one if not
	 */
	// checkEasterEggsFile() {
	//
	//   let EasterEggs = require("./src/utils/eastereggs/EasterEggs");
	//   EasterEggs.init();
	//
	//   const fs = require('fs');
	//   if (!fs.existsSync('./src/utils/eastereggs/EasterEggs.js')) {
	//     fs.copyFileSync('./src/utils/eastereggs/EasterEggs.js.default',
	//         './src/utils/eastereggs/EasterEggs.js', (err) => {
	//           if (err) throw err;
	//         });
	//     console.warn(
	//         './src/utils/eastereggs/EasterEggs.js not found. ./src/utils/eastereggs/EasterEggs.js.default copied to be used.');
	//     console.warn(
	//         'Ignore this message if you don\'t have the key to decrypt the file.');
	//   }
	// }
}

/**
 * @type {{init: (function(): DraftBot)}}
 */
module.exports = {
	init: DraftBot.init,
	dailyTimeout: DraftBot.dailyTimeout,
	twe: DraftBot.topWeekEnd,
};
/**
 * @type {module:"discord.js"}
 */
global.discord = require("discord.js");
/**
 * @type {module:"discord.js".Client}
 */
global.client = new (require("discord.js").Client)({restTimeOffset: 0});
