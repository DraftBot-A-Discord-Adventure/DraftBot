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
import {LogsPossibility} from "./models/LogsPossibility";
import {LogsPlayerPossibilities} from "./models/LogsPlayerPossibilities";
import {LogsAlteration} from "./models/LogsAlteration";
import {Constants} from "../../Constants";
import {LogsPlayerStandardAlteration} from "./models/LogsPlayerStandardAlteration";
import {LogsPlayerOccupiedAlteration} from "./models/LogsPlayerOccupiedAlteration";
import {LogsUnlocks} from "./models/LogsUnlocks";
import {LogsPlayerClassChanges} from "./models/LogsPlayerClassChanges";
import {LogsPlayerVote} from "./models/LogsPlayerVote";
import {LogsServerJoin} from "./models/LogsServerJoin";
import {LogsServerQuit} from "./models/LogsServerQuit";

export enum NumberChangeReason {
	// Default value. Used to detect missing parameters in functions
	NULL,

	// Admin
	TEST,
	ADMIN,
	DEBUG,

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
	RESPAWN,
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
				}, {transaction});
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
				}, {transaction});
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
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logBigEvent(discordId: string, eventId: number, possibilityEmote: string, issueIndex: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayer.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				const [possibility] = await LogsPossibility.findOrCreate({
					where: {
						bigEventId: eventId,
						emote: possibilityEmote === "end" ? null : possibilityEmote,
						issueIndex
					},
					transaction
				});
				await LogsPlayerPossibilities.create({
					playerId: player.id,
					bigEventId: eventId,
					possibilityId: possibility.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logAlteration(discordId: string, alteration: string, reason: NumberChangeReason, duration: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayer.findOrCreate({
					where: {
						discordId
					},
					transaction
				});
				switch (alteration) {
				case Constants.EFFECT.OCCUPIED:
					await LogsPlayerOccupiedAlteration.create({
						playerId: player.id,
						duration: duration,
						reason: reason,
						date: Math.trunc(Date.now() / 1000)
					}, {transaction});
					break;
				default:
					await LogsPlayerStandardAlteration.create({
						playerId: player.id,
						alterationId: (await LogsAlteration.findOrCreate({
							where: {
								alteration: alteration
							},
							transaction
						}))[0].id,
						reason,
						date: Math.trunc(Date.now() / 1000)
					}, {transaction});
				}
				await transaction.commit();
				resolve();
			});
		});
	}

	public logUnlocks(buyerDiscordId: string, releasedDiscordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [buyer] = await LogsPlayer.findOrCreate({
					where: {
						discordId: buyerDiscordId
					},
					transaction
				});
				const [released] = await LogsPlayer.findOrCreate({
					where: {
						discordId: releasedDiscordId
					},
					transaction
				});
				await LogsUnlocks.create({
					buyerId: buyer.id,
					releasedId: released.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logPlayerClassChange(discordId: string, classId: number): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayer.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await LogsPlayerClassChanges.create({
					playerId: player.id,
					classId,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logVote(discordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [player] = await LogsPlayer.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await LogsPlayerVote.create({
					playerId: player.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logServerJoin(discordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [server] = await LogsServer.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await LogsServerJoin.create({
					serverId: server.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}

	public logServerQuit(discordId: string): Promise<void> {
		return new Promise((resolve) => {
			this.sequelize.transaction().then(async (transaction) => {
				const [server] = await LogsServer.findOrCreate({
					where: {
						discordId: discordId
					},
					transaction
				});
				await LogsServerQuit.create({
					serverId: server.id,
					date: Math.trunc(Date.now() / 1000)
				}, {transaction});
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
				}, {transaction});
				await transaction.commit();
				resolve();
			});
		});
	}
}