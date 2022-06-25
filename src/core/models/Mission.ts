import {DataTypes, Model, Sequelize} from "sequelize";
import {format} from "../utils/StringFormatter";
import {MissionDifficulty} from "../missions/MissionDifficulty";
import {MissionsController} from "../missions/MissionsController";
import moment = require("moment");

export class Mission extends Model {
	public id!: string;

	public descFr!: string;

	public descEn!: string;

	public campaignOnly!: boolean;

	public canBeDaily!: boolean;

	public canBeEasy!: boolean;

	public canBeMedium!: boolean;

	public canBeHard!: boolean;

	public updatedAt!: Date;

	public createdAt!: Date;


	public async formatDescription(objective: number, variant: number, language: string, saveBlob: Buffer): Promise<string> {
		return format(language === "fr" ? this.descFr : this.descEn, {
			objective,
			variantText: await MissionsController.getVariantFormatText(this.id, variant, objective, language, saveBlob),
			variant
		});
	}
}

export class Missions {
	static async getRandomMission(difficulty: MissionDifficulty): Promise<Mission> {
		switch (difficulty) {
		case MissionDifficulty.EASY:
			return await Mission.findOne({
				where: {
					campaignOnly: false,
					canBeEasy: true
				},
				order: [Sequelize.fn("RANDOM")]
			});
		case MissionDifficulty.MEDIUM:
			return await Mission.findOne({
				where: {
					campaignOnly: false,
					canBeMedium: true
				},
				order: [Sequelize.fn("RANDOM")]
			});
		case MissionDifficulty.HARD:
			return await Mission.findOne({
				where: {
					campaignOnly: false,
					canBeHard: true
				},
				order: [Sequelize.fn("RANDOM")]
			});
		default:
			return null;
		}
	}

	static async getRandomDailyMission(): Promise<Mission> {
		return await Mission.findOne({
			where: {
				campaignOnly: false,
				canBeDaily: true
			},
			order: [Sequelize.fn("RANDOM")]
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

export function initModel(sequelize: Sequelize): void {
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
		canBeDaily: {
			type: DataTypes.BOOLEAN
		},
		canBeEasy: {
			type: DataTypes.INTEGER
		},
		canBeMedium: {
			type: DataTypes.INTEGER
		},
		canBeHard: {
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