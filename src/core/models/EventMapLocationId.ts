import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");

export class EventMapLocationId extends Model {
	public readonly eventId!: number;

	public readonly mapLocationId!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class EventMapLocationIds {

}

export function initModel(sequelize: Sequelize): void  {
	EventMapLocationId.init({
		eventId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		mapLocationId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
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
		tableName: "event_map_location_ids",
		freezeTableName: true
	});

	EventMapLocationId.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default EventMapLocationId;