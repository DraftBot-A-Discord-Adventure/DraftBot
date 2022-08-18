import {DataTypes, Model, Sequelize} from "sequelize";
import {datesAreOnSameDay} from "../../../utils/TimeUtils";
import {MissionsController} from "../../../missions/MissionsController";
import Mission from "./Mission";
import {Data} from "../../../Data";
import PlayerMissionsInfo from "./PlayerMissionsInfo";
import moment = require("moment");
import {draftBotInstance} from "../../../bot";

export class DailyMission extends Model {
	public readonly id!: number;

	public missionId!: string;

	public objective!: number;

	public variant!: number;

	public gemsToWin!: number;

	public xpToWin!: number;

	public moneyToWin!: number;

	public lastDate!: Date;

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
		if (!dailyMission || !datesAreOnSameDay(dailyMission.lastDate, new Date())) {
			await PlayerMissionsInfo.update({
				dailyMissionNumberDone: 0
			}, {where: {}});
			dailyMission = await DailyMissions.regenerateDailyMission();
		}
		return dailyMission;
	}

	static async regenerateDailyMission(): Promise<DailyMission> {
		const prop = await MissionsController.generateRandomDailyMissionProperties();
		const dailyMission = await DailyMissions.queryDailyMission();
		const missionData = Data.getModule("missions." + prop.mission.id);
		if (!dailyMission) {
			await DailyMission.create({
				id: 0,
				missionId: prop.mission.id,
				objective: missionData.getNumberFromArray("objectives", prop.index),
				variant: prop.variant,
				gemsToWin: missionData.getNumberFromArray("gems", prop.index),
				xpToWin: missionData.getNumberFromArray("xp", prop.index),
				moneyToWin: missionData.getNumberFromArray("money", prop.index),
				lastDate: new Date()
			});
		}
		else {
			dailyMission.missionId = prop.mission.id;
			dailyMission.objective = missionData.getNumberFromArray("objectives", prop.index);
			dailyMission.variant = prop.variant;
			dailyMission.gemsToWin = missionData.getNumberFromArray("gems", prop.index);
			dailyMission.xpToWin = missionData.getNumberFromArray("xp", prop.index);
			dailyMission.lastDate = new Date();
			await dailyMission.save();
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

export function setAssociations(): void {
	DailyMission.hasOne(Mission, {
		sourceKey: "missionId",
		foreignKey: "id",
		as: "Mission"
	});
}

export default DailyMission;