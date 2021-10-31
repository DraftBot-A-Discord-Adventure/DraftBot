import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");
import {datesAreOnSameDay} from "../utils/TimeUtils";

export class PlayerMissionsInfo extends Model {
	public readonly playerId!: number;

	public gems!: number;

	public dailyMissionNumberDone!: number;

	public lastDailyMissionCompleted!: Date;

	public slotsCount!: number;

	public campaignProgression!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public hasCompletedDailyMission(): boolean {
		return this.lastDailyMissionCompleted && datesAreOnSameDay(this.lastDailyMissionCompleted, new Date());
	}
}

export function initModel(sequelize: Sequelize) {
	PlayerMissionsInfo.init({
		playerId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		gems: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		dailyMissionNumberDone: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		lastDailyMissionCompleted: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		slotsCount: {
			type: DataTypes.INTEGER,
			defaultValue: 1
		},
		campaignProgression: {
			type: DataTypes.INTEGER,
			defaultValue: 0
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
		tableName: "player_missions_info",
		freezeTableName: true
	});

	PlayerMissionsInfo.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default PlayerMissionsInfo;