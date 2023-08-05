import {DataTypes, Model, Sequelize} from "sequelize";
import {datesAreOnSameDay} from "../../../utils/TimeUtils";
import {MissionsController} from "../../../missions/MissionsController";
import Mission, {Missions} from "./Mission";
import {Data} from "../../../Data";
import PlayerMissionsInfo from "./PlayerMissionsInfo";
import {draftBotInstance} from "../../../bot";
import moment = require("moment");

export class DailyMission extends Model {
	declare readonly id: number;

	declare missionId: string;

	declare objective: number;

	declare variant: number;

	declare gemsToWin: number;

	declare xpToWin: number;

	declare pointsToWin: number;

	declare moneyToWin: number;

	declare lastDate: Date;

	declare updatedAt: Date;

	declare createdAt: Date;

	declare Mission: Mission;
}

export class DailyMissions {
	static async queryDailyMission(): Promise<DailyMission> {
		return await DailyMission.findOne();
	}

	static async getOrGenerate(): Promise<DailyMission> {
		let dailyMission = await DailyMissions.queryDailyMission();
		if (!dailyMission || !datesAreOnSameDay(dailyMission.lastDate, new Date())) {
			await PlayerMissionsInfo.update({
				dailyMissionNumberDone: 0
			}, {where: {}});
			dailyMission = await DailyMissions.regenerateDailyMission();
		}
		dailyMission.Mission = await Missions.getById(dailyMission.missionId);
		return dailyMission;
	}

	static async regenerateDailyMission(): Promise<DailyMission> {
		const prop = await MissionsController.generateRandomDailyMissionProperties();
		let dailyMission = await DailyMissions.queryDailyMission();
		const missionData = Data.getModule(`missions.${prop.mission.id}`);
		if (dailyMission) {
			dailyMission.missionId = prop.mission.id;
			dailyMission.objective = missionData.getNumberFromArray("objectives", prop.index);
			dailyMission.variant = prop.variant;
			dailyMission.pointsToWin = missionData.getNumberFromArray("points", prop.index);
			dailyMission.gemsToWin = missionData.getNumberFromArray("gems", prop.index);
			dailyMission.xpToWin = missionData.getNumberFromArray("xp", prop.index);
			dailyMission.moneyToWin = missionData.getNumberFromArray("money", prop.index);
			dailyMission.lastDate = new Date();
			await dailyMission.save();
		}
		else {
			dailyMission = await DailyMission.create({
				id: 0,
				missionId: prop.mission.id,
				objective: missionData.getNumberFromArray("objectives", prop.index),
				variant: prop.variant,
				pointsToWin: missionData.getNumberFromArray("points", prop.index),
				gemsToWin: missionData.getNumberFromArray("gems", prop.index),
				xpToWin: missionData.getNumberFromArray("xp", prop.index),
				moneyToWin: missionData.getNumberFromArray("money", prop.index),
				lastDate: new Date()
			}, {returning: true});
		}
		draftBotInstance.logsDatabase.logMissionDailyRefreshed(dailyMission.missionId, dailyMission.variant, dailyMission.objective).then();
		return await this.queryDailyMission();
	}
}

export function initModel(sequelize: Sequelize): void {
	DailyMission.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		missionId: {
			type: DataTypes.TEXT
		},
		objective: {
			type: DataTypes.INTEGER
		},
		variant: {
			type: DataTypes.INTEGER
		},
		gemsToWin: {
			type: DataTypes.INTEGER
		},
		pointsToWin: {
			type: DataTypes.INTEGER
		},
		xpToWin: {
			type: DataTypes.INTEGER
		},
		moneyToWin: {
			type: DataTypes.INTEGER
		},
		lastDate: {
			type: DataTypes.DATE
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
		tableName: "daily_mission",
		freezeTableName: true
	});

	DailyMission.beforeSave(instance => {
		instance.updatedAt = new Date();
	});
}

export default DailyMission;