import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");
import {datesAreOnSameDay} from "../utils/TimeUtils";
import {MissionsController} from "../missions/MissionsController";
import {RandomUtils} from "../utils/RandomUtils";
import {Constants} from "../Constants";
import Mission from "./Mission";

export class DailyMission extends Model {
	public missionId!: string;

	public objective!: number;

	public variant!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public Mission: Mission;
}

export class DailyMissions {
	static async queryDailyMission(): Promise<DailyMission> {
		return await DailyMission.findOne({
			include: [
				{
					model: Mission,
					as: "Mission"
				}
			]
		});
	}

	static async getOrGenerate(): Promise<DailyMission> {
		let dailyMission = await DailyMissions.queryDailyMission();
		if (!dailyMission || !datesAreOnSameDay(dailyMission.updatedAt, new Date())) {
			dailyMission = await DailyMissions.regenerateDailyMission();
		}
		return dailyMission;
	}

	static async regenerateDailyMission(): Promise<DailyMission> {
		const prop = await MissionsController.generateRandomMissionProperties(
			RandomUtils.draftbotRandom.integer(
				Constants.MISSION.DAILY_MIN_DIFFICULTY,
				Constants.MISSION.DAILY_MAX_DIFFICULTY
			)
		);
		let dailyMission = await DailyMissions.queryDailyMission();
		if (!dailyMission) {
			dailyMission = await DailyMission.create({
				missionId: prop.mission.id,
				objective: prop.objective,
				variant: prop.variant
			});
		}
		else {
			dailyMission.missionId = prop.mission.id;
			dailyMission.objective = prop.objective;
			dailyMission.variant = prop.variant;
			await dailyMission.save();
		}
		return dailyMission;
	}
}

export function initModel(sequelize: Sequelize) {
	DailyMission.init({
		missionId: {
			type: DataTypes.TEXT,
			primaryKey: true
		},
		objective: {
			type: DataTypes.INTEGER
		},
		variant: {
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
		tableName: "daily_mission",
		freezeTableName: true
	});

	DailyMission.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default DailyMission;