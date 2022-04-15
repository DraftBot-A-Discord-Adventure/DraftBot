import {DataTypes, Model, Sequelize} from "sequelize";
import {datesAreOnSameDay} from "../utils/TimeUtils";
import moment = require("moment");

export class PlayerMissionsInfo extends Model {
	public readonly playerId!: number;

	public gems!: number;

	public hasBoughtPointsThisWeek!: boolean;

	public dailyMissionNumberDone!: number;

	public lastDailyMissionCompleted!: Date;

	public campaignProgression!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	public hasCompletedDailyMission(): boolean {
		return this.lastDailyMissionCompleted && datesAreOnSameDay(this.lastDailyMissionCompleted, new Date());
	}

	static async resetShopBuyout() {
		await PlayerMissionsInfo.update(
			{
				hasBoughtPointsThisWeek: false
			}, {where: {}});
	}

	public addGems(amount: number): void {
		this.gems += amount;
	}
}

export function initModel(sequelize: Sequelize): void {
	PlayerMissionsInfo.init({
		playerId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		gems: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		hasBoughtPointsThisWeek: {
			type: DataTypes.BOOLEAN,
			defaultValue: false
		},
		dailyMissionNumberDone: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		lastDailyMissionCompleted: {
			type: DataTypes.DATE,
			defaultValue: null
		},
		campaignProgression: {
			type: DataTypes.INTEGER,
			defaultValue: 1
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