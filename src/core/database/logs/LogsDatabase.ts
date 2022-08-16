import {Database} from "../Database";
import {LogsPlayerMoney} from "./models/LogsPlayerMoney";
import {LogsPlayer} from "./models/LogsPlayer";
import {LogsPlayerHealth} from "./models/LogsPlayerHealth";
import {LogsPlayerExperience} from "./models/LogsPlayerExperience";
import {CreateOptions, Model} from "sequelize";
import {LogsPlayerLevel} from "./models/LogsPlayerLevel";
import {LogsPlayerScore} from "./models/LogsPlayerScore";
import {LogsPlayerGems} from "./models/LogsPlayerGems";

export enum NumberChangeReason {
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
	LEVEL_UP
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

	public logNumberChange(
		discordId: string,
		value: number,
		reason: NumberChangeReason,
		model: { create: (values?: unknown, options?: CreateOptions<unknown>) => Promise<Model<unknown, unknown>> }
	): Promise<void> {
		return new Promise((resolve) => {
			LogsPlayer.findOrCreate({
				where: {
					discordId: discordId
				}
			}).then(([logsPlayer]) =>
				model.create({
					playerId: logsPlayer.id,
					value,
					reason,
					date: Math.trunc(Date.now() / 1000)
				}).then(() => resolve())
			);
		});
	}
}