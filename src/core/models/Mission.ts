import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";

export class Mission extends Model {
	public updatedAt!: Date;

	public createdAt!: Date;
}

export class Missions {

}

export function initModel(sequelize: Sequelize) {
	Mission.init({
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
		tableName: "missions",
		freezeTableName: true
	});

	Mission.beforeSave(instance => {
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default Mission;