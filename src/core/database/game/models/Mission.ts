import {DataTypes, Model, Op, Sequelize} from "sequelize";
import {format} from "../../../utils/StringFormatter";
import {MissionDifficulty} from "../../../missions/MissionDifficulty";
import {MissionsController} from "../../../missions/MissionsController";
import {draftBotInstance} from "../../../bot";
import {Constants} from "../../../Constants";
import moment = require("moment");

export class Mission extends Model {
	declare id: string;

	declare descFr: string;

	declare descEn: string;

	declare campaignOnly: boolean;

	declare canBeDaily: boolean;

	declare canBeEasy: boolean;

	declare canBeMedium: boolean;

	declare canBeHard: boolean;

	declare updatedAt: Date;

	declare createdAt: Date;


	public async formatDescription(objective: number, variant: number, language: string, saveBlob: Buffer): Promise<string> {
		return format(language === Constants.LANGUAGE.FRENCH ? this.descFr : this.descEn, {
			objective,
			variantText: await MissionsController.getVariantFormatText(this.id, variant, objective, language, saveBlob),
			variant
		});
	}
}

export class Missions {
	static async getRandomMission(difficulty: MissionDifficulty, exceptions: string = null): Promise<Mission> {
		const whereClause: { [key: string]: boolean | { [Op.ne]: string } } = {};

		if (exceptions !== null) {
			whereClause.id = {[Op.ne]: exceptions};
		}

		switch (difficulty) {
		case MissionDifficulty.EASY:
			whereClause.campaignOnly = false;
			whereClause.canBeEasy = true;
			return await Mission.findOne({
				where: whereClause,
				order: [draftBotInstance.gameDatabase.sequelize.random()]
			});
		case MissionDifficulty.MEDIUM:
			whereClause.campaignOnly = false;
			whereClause.canBeMedium = true;
			return await Mission.findOne({
				where: whereClause,
				order: [draftBotInstance.gameDatabase.sequelize.random()]
			});
		case MissionDifficulty.HARD:
			whereClause.campaignOnly = false;
			whereClause.canBeHard = true;
			return await Mission.findOne({
				where: whereClause,
				order: [draftBotInstance.gameDatabase.sequelize.random()]
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
			order: [draftBotInstance.gameDatabase.sequelize.random()]
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
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
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