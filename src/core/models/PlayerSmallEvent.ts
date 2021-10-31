import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");
import Player from "./Player";

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
			playerId: playerId,
			eventType: eventType,
			time: time
		});
	}

	static getLast(playerSmallEvents: PlayerSmallEvent[]): PlayerSmallEvent {
		let mostRecent = null;
		for (const i of playerSmallEvents) {
			if (mostRecent === null) {
				mostRecent = i;
			}
			else if (i.time >= mostRecent.time) {
				mostRecent = i;
			}
		}
		return mostRecent;
	}

	static async calculateCurrentScore(player: Player) {
		const numberOfSmallEventsDone = player.PlayerSmallEvents.length;
		const tripDuration = await player.getCurrentTripDuration();
		let somme = 0;
		for (let i = 1 ; i <= numberOfSmallEventsDone; i++){
			// By Pokegali Le sang (et romain22222 pour sa tentative)
			// vive la tangente hyperbolique
			const init = 75 + ((tripDuration - 1) / 2) ** 2;
			somme += Math.floor(init * Math.tanh(-(i - 1) / (tripDuration ** 0.75 * 2)) + init + 5);
		}
		return somme;
	}

	static async removeSmallEventsOfPlayer(playerId: number) {
		await PlayerSmallEvent.destroy({where: {playerId: playerId}});
	}
}

export function initModel(sequelize: Sequelize) {
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
			type: DataTypes.INTEGER
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")()
				.format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")()
				.format("YYYY-MM-DD HH:mm:ss")
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