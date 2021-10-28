import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";

export class MapLocation extends Model {
	public id!: number;

	public type!: string;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export class MapLocations {

}

export function initModel(sequelize: Sequelize) {
	MapLocation.init({
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
		tableName: "map_locations",
		freezeTableName: true
	});

	MapLocation.beforeSave(instance => {
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default MapLocation;