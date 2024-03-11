import {DraftBotConfig} from "./DraftBotConfig";
import {PacketListenerServer} from "../../../../Lib/src/packets/PacketListener";
import {GameDatabase} from "../database/game/GameDatabase";
import {LogsDatabase} from "../database/logs/LogsDatabase";
import {draftBotInstance} from "../../index";
import {Settings} from "../database/game/models/Setting";
import {PetConstants} from "../../../../Lib/src/constants/PetConstants";
import {Op} from "sequelize";
import PetEntity from "../database/game/models/PetEntity";
import {RandomUtils} from "../utils/RandomUtils";
import {PotionDataController} from "../../data/Potion";
import {getNextDay2AM} from "../../../../Lib/src/utils/TimeUtils";
import {TIMEOUT_FUNCTIONS} from "../../../../Lib/src/constants/TimeoutFunctionsConstants";
import {MapCache} from "../maps/MapCache";
import {registerAllPacketHandlers} from "../packetHandlers/PacketHandler";

export class DraftBot {
	public readonly packetListener: PacketListenerServer;

	public readonly gameDatabase: GameDatabase;

	public readonly logsDatabase: LogsDatabase;

	private config: DraftBotConfig;

	constructor(config: DraftBotConfig) {
		this.config = config;

		// Register commands
		this.packetListener = new PacketListenerServer();

		// Databases
		this.gameDatabase = new GameDatabase();
		this.logsDatabase = new LogsDatabase();
	}

	/**
	 * Execute all the daily tasks
	 */
	static dailyTimeout(): void {
		DraftBot.randomPotion().finally(() => null);
		DraftBot.randomLovePointsLoose().then((petLoveChange) => draftBotInstance.logsDatabase.logDailyTimeout(petLoveChange).then());
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
	 * Launch the program that execute the daily tasks
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
	static seasonEnd(): Promise<void> {
		// TODO reforge this function
		return null;
		/* DraftBotInstance.logsDatabase.log15BestSeason().then();
		const winner = await DraftBot.findSeasonWinner();
		if (winner !== null) {
			await draftBotClient.shard.broadcastEval((client, context: { config: DraftBotConfig, frSentence: string, enSentence: string }) => {
				client.guilds.fetch(context.config.MAIN_SERVER_ID).then((guild) => {
					if (guild.shard) {
						try {
							guild.channels.fetch(context.config.FRENCH_ANNOUNCEMENT_CHANNEL_ID).then(channel => {
								(channel as TextChannel).send({
									content: context.frSentence
								}).then(message => {
									message.react("✨").then();
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
									message.react("✨").then();
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
					frSentence: Translations.getModule("bot", Constants.LANGUAGE.FRENCH).format("seasonEndAnnouncement", {
						mention: winner.getMention()
					}),
					enSentence: Translations.getModule("bot", Constants.LANGUAGE.ENGLISH).format("seasonEndAnnouncement", {
						mention: winner.getMention()
					})
				}
			});
			winner.addBadge("✨");
			await winner.save();
		}
		await DraftBot.seasonEndQueries();

		console.log("# WARNING # Season has been ended !");
		DraftBot.programSeasonTimeout();
		draftBotInstance.logsDatabase.logSeasonEnd().then(); */
	}

	/**
	 * End the top week
	 */
	static topWeekEnd(): Promise<void> {
		// TODO reforge this function
		return null;
		/* DraftBotInstance.logsDatabase.log15BestTopWeek().then();
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
			winner.addBadge("🎗️");
			await winner.save();
		}
		await Player.update({weeklyScore: 0}, {where: {}});
		console.log("# WARNING # Weekly leaderboard has been reset !");
		await PlayerMissionsInfo.resetShopBuyout();
		console.log("All players can now buy again points from the mission shop !");
		DraftBot.programWeeklyTimeout();
		draftBotInstance.logsDatabase.logTopWeekEnd().then(); */
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
		DraftBot.topWeekEnd().then();
		DraftBot.newPveIsland().then();
	}

	async init(): Promise<void> {
		await registerAllPacketHandlers();
		await this.gameDatabase.init();
		await this.logsDatabase.init();
		await MapCache.init();
	}
}