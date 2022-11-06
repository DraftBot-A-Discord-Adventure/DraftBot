import {DataTypes, Model, Sequelize} from "sequelize";
import Player from "./Player";
import moment = require("moment");

export class PlayerSmallEvent extends Model {
	public readonly id!: number;

	public readonly playerId!: number;

	public readonly eventType!: string;

	public time!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class PlayerSmallEvents {
	static createPlayerSmallEvent(playerId: number, eventType: string, time: number): PlayerSmallEvent {
		return PlayerSmallEvent.build({
			playerId,
			eventType: eventType,
			time: time
		});
	}

	static async getLastOfPlayer(playerId: number): Promise<PlayerSmallEvent> {
		const playerSmallEvents = await PlayerSmallEvents.getSmallEventsOfPlayer(playerId);
		if (!playerSmallEvents) {
			return null;
		}
		let mostRecent = playerSmallEvents[0];
		for (const smallEvent of playerSmallEvents) {
			if (smallEvent.id >= mostRecent.id) {
				mostRecent = smallEvent;
			}
		}
		return mostRecent;
	}

	static getLast(playerSmallEvents: PlayerSmallEvent[]): PlayerSmallEvent {
		if (!playerSmallEvents) {
			return null;
		}
		let mostRecent = playerSmallEvents[0];
		for (const smallEvent of playerSmallEvents) {
			if (smallEvent.id >= mostRecent.id) {
				mostRecent = smallEvent;
			}
		}
		return mostRecent;
	}

	static async calculateCurrentScore(player: Player): Promise<number> {
		const numberOfSmallEventsDone = await PlayerSmallEvent.count({
			where: {
				playerId: player.id
			}
		});
		const tripDuration = await player.getCurrentTripDuration();
		let somme = 0;
		for (let i = 1; i <= numberOfSmallEventsDone; i++) {
			// By Pokegali Le sang (et romain22222 pour sa tentative)
			// vive la tangente hyperbolique
			const init = 75 + ((tripDuration - 1) / 2) ** 2;
			somme += Math.floor(init * Math.tanh(-(i - 1) / (tripDuration ** 0.75 * 2)) + init + 5);
		}
		return somme;
	}

	static async removeSmallEventsOfPlayer(playerId: number): Promise<void> {
		await PlayerSmallEvent.destroy({where: {playerId: playerId}});
	}

	static async getSmallEventsOfPlayer(playerId: number): Promise<PlayerSmallEvent[]> {
		return await PlayerSmallEvent.findAll({
			where: {
				playerId
			}
		});
	}
}

export function initModel(sequelize: Sequelize): void {
	PlayerSmallEvent.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		playerId: {
			type: DataTypes.INTEGER
		},
		eventType: {
			type: DataTypes.TEXT
		},
		time: {
			type: DataTypes.BIGINT
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "player_small_events",
		freezeTableName: true
	});

	PlayerSmallEvent.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default PlayerSmallEvent;