import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");

export class PlayerSmallEvent extends Model {
	public time!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class PlayerSmallEvents {
	static getLast(playerSmallEvents: PlayerSmallEvent[]): PlayerSmallEvent {
		let mostRecent = null;
		for (const i of playerSmallEvents) {
			if (mostRecent === null) {
				mostRecent = i;
			} else if (i.time >= mostRecent.time) {
				mostRecent = i;
			}
		}
		return mostRecent;
	}
}

export function initModel(sequelize: Sequelize) {
	PlayerSmallEvent.init({
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
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