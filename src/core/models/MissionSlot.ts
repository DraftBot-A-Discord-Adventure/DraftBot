import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import Mission from "./Mission";
import moment = require("moment");

export class MissionSlot extends Model {
	public readonly id!: number;

	public readonly playerId!: number;

	public missionId!: string;

	public missionVariant!: number;

	public missionObjective!: number;

	public expiresAt!: Date;

	public numberDone!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public Mission: Mission;


	public isCompleted(): boolean {
		return this.numberDone >= this.missionObjective;
	}

	public isCampaign(): boolean {
		return this.expiresAt === null;
	}

	public hasExpired(): boolean {
		return this.expiresAt !== null && this.expiresAt < new Date();
	}
}

export function initModel(sequelize: Sequelize) {
	MissionSlot.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		playerId: {
			type: DataTypes.INTEGER
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