import {Database} from "../Database";
import {LogsPlayerMoney} from "./models/LogsPlayerMoney";
import {LogsPlayer} from "./models/LogsPlayer";
import {LogsPlayerHealth} from "./models/LogsPlayerHealth";
import {LogsPlayerExperience} from "./models/LogsPlayerExperience";
import {CreateOptions, Model} from "sequelize";
import {LogsPlayerLevel} from "./models/LogsPlayerLevel";
import {LogsPlayerScore} from "./models/LogsPlayerScore";
import {LogsPlayerGems} from "./models/LogsPlayerGems";
import {LogsServer} from "./models/LogsServer";
import {LogsCommand} from "./models/LogsCommand";
import {LogsPlayerCommands} from "./models/LogsPlayerCommands";
import {LogsSmallEvent} from "./models/LogsSmallEvent";
import {LogsPlayerSmallEvents} from "./models/LogsPlayerSmallEvents";
import {LogsPlayerBigEvents} from "./models/LogsPlayerBigEvents";

export enum NumberChangeReason {
	// Default value. Used to detect missing parameters in functions
	NULL,

	// Admin
	TEST,
	ADMIN,

	// Events
	BIG_EVENT,
	SMALL_EVENT,
	RECEIVE_COIN,

	// Pets
	PET_SELL,
	PET_FEED,
	PET_FREE,

	// Missions
	MISSION_FINISHED,
	MISSION_SHOP,

	// Guild
	GUILD_DAILY,
	GUILD_CREATE,

	// Items
	ITEM_SELL,
	DAILY,
	DRINK,

	// Misc
	SHOP,
	CLASS,
	UNLOCK,
	LEVEL_UP,
	RESPAWN
}

export class LogsDatabase extends Database {

	constructor() {
		super("logs");
	}

	public logMoneyChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayerMoney);
	}

	public logHealthChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayerHealth);
	}

	public logExperienceChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayerExperience);
	}

	public logScoreChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayerScore);
	}

	public logGemsChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return this.logNumberChange(discordId, value, reason, LogsPlayerGems);
	}

	public logLevelChange(discordId: string, level: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayer.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await LogsPlayerLevel.create({
					playerId: player.id,
					level,
					date: Math.trunc(Date.now() / 1000)
				}, { transaction });
				await transaction.commit();
				resolve();
			});
		});
	}

	private logNumberChange(
		discordId: string,
		value: number,
		reason: NumberChangeReason,
		model: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> }
	): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayer.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				await model.create({
					playerId: player.id,
					value,
					reason,
					date: Math.trunc(Date.now() / 1000)
				}, { transaction });
				await transaction.commit();
				resolve();
			});
		});
	}

	public logCommandUsage(discordId: string, serverId: string, commandName: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayer.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				const [server] = await LogsServer.findOrCreate({
					where: {
						discordId: serverId
					},
					transaction
				});
				const [command] = await LogsCommand.findOrCreate({
					where: {
						commandName
					},
					transaction
				});
				await LogsPlayerCommands.create({
					playerId: player.id,
					serverId: server.id,
					commandId: command.id,
					date: Math.trunc(Date.now() / 1000)
				}, { transaction });
				await transaction.commit();
				resolve();
			});
		});
	}

	public logSmallEvent(discordId: string, name: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayer.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				const [smallEvent] = await LogsSmallEvent.findOrCreate({
					where: {
						name
					},
					transaction
				});
				await LogsPlayerSmallEvents.create({
					playerId: player.id,
					smallEventId: smallEvent.id,
					date: Math.trunc(Date.now() / 1000)
				}, { transaction });
				await transaction.commit();
				resolve();
			});
		});
	}

	public logBigEvent(discordId: string, eventId: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayer.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				await LogsPlayerBigEvents.create({
					playerId: player.id,
					bigEventId: eventId,
					date: Math.trunc(Date.now() / 1000)
				}, { transaction });
				await transaction.commit();
				resolve();
			});
		});
	}

}