import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import Mission from "./Mission";

export class MissionSlot extends Model {
	public updatedAt!: Date;

	public createdAt!: Date;


	public Mission: Mission;
}

export class MissionSlots {

}

export function initModel(sequelize: Sequelize) {
	MissionSlot.init({
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
		tableName: "mission_slots",
		freezeTableName: true
	});

	MissionSlot.beforeSave(instance => {
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default MissionSlot;