import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import Mission from "./Mission";
import moment = require("moment");

export class MissionSlot extends Model {
	public playerId!: number;

	public missionId!: number;

	public missionVariant!: number;

	public missionObjective!: number;

	public expiresAt!: Date;

	public numberDone!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public Mission: Mission;
}

export class MissionSlots {

}

export function initModel(sequelize: Sequelize) {
	MissionSlot.init({
		playerId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		missionId: {
			type: DataTypes.TEXT
		},
		missionVariant: {
			type: DataTypes.INTEGER
		},
		missionObjective: {
			type: DataTypes.INTEGER
		},
		expiresAt: {
			type: DataTypes.DATE
		},
		numberDone: {
			type: DataTypes.INTEGER
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
		tableName: "mission_slots",
		freezeTableName: true
	});

	MissionSlot.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default MissionSlot;