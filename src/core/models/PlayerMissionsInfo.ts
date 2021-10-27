import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";

export class PlayerMissionsInfo extends Model {
	public updatedAt!: Date;

	public createdAt!: Date;
}

export class PlayerMissionsInfos {

}

export function initModel(sequelize: Sequelize) {
	PlayerMissionsInfo.init({
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
		tableName: "player_missions_info",
		freezeTableName: true
	});

	PlayerMissionsInfo.beforeSave(instance => {
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default PlayerMissionsInfo;