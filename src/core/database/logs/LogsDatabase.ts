import {Database} from "../Database";
import {LogsPlayerMoney} from "./models/LogsPlayerMoney";
import {LogsPlayer} from "./models/LogsPlayer";

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
}

export class LogsDatabase extends Database {

	constructor() {
		super("logs");
	}

	public logMoneyChange(discordId: string, value: number, reason: NumberChangeReason): Promise<void> {
		return new Promise((resolve) => {
			LogsPlayer.findOrCreate({
				where: {
					discordId: discordId
				}
			}).then(([logsPlayer]) =>
				LogsPlayerMoney.create({
					playerId: logsPlayer.id,
					value,
					reason,
					date: Math.trunc(Date.now() / 1000)
				}).then(() => resolve())
			);
		});
	}
}