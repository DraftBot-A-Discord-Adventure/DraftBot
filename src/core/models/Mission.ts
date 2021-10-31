import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");
import {format} from "../utils/StringFormatter";

export class Mission extends Model {
	public readonly id!: string;

	public readonly descFr!: string;

	public readonly descEn!: string;

	public readonly campaignOnly!: boolean;

	public readonly gems!: number;

	public readonly xp!: number;

	public readonly baseDifficulty!: number;

	public readonly baseDuration!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public objectiveForDifficulty(difficulty: number): number {
		return difficulty * this.baseDifficulty;
	}

	public durationForDifficulty(difficulty: number): number {
		return difficulty * this.baseDuration;
	}

	public formatDescription(objective: number, language: string): string {
		return format(language === "fr" ? this.descFr : this.descEn, {
			objective
		});
	}
}

export class Missions {
	static async getRandomMission(): Promise<Mission> {
		return await Mission.findOne({
			where: {
				campaignOnly: false
			}
		});
	}

	static async getById(missionId: string): Promise<Mission> {
		return await Mission.findOne({
			where: {
				id: missionId
			}
		});
	}
}

export function initModel(sequelize: Sequelize) {
	Mission.init({
		id: {
			type: DataTypes.TEXT,
			primaryKey: true
		},
		descFr: {
			type: DataTypes.TEXT
		},
		descEn: {
			type: DataTypes.TEXT
		},
		campaignOnly: {
			type: DataTypes.BOOLEAN
		},
		gems: {
			type: DataTypes.INTEGER
		},
		xp: {
			type: DataTypes.INTEGER
		},
		baseDifficulty: {
			type: DataTypes.INTEGER
		},
		baseDuration: {
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
		tableName: "missions",
		freezeTableName: true
	});

	Mission.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Mission;