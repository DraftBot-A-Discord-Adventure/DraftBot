import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";

export class PlayerSmallEvent extends Model {
	public updatedAt!: Date;

	public createdAt!: Date;
}

export class PlayerSmallEvents {

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
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default PlayerSmallEvent;