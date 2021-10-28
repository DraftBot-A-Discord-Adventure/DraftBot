import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";

export class EventMapLocationId extends Model {
	public eventId!: number;

	public mapLocationId!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class EventMapLocationIds {

}

export function initModel(sequelize: Sequelize) {
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
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default EventMapLocationId;