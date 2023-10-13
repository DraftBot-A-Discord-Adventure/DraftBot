import {DataTypes, Model, Sequelize} from "sequelize";
import {datesAreOnSameDay} from "../../../utils/TimeUtils";
import {NumberChangeReason} from "../../../constants/LogsConstants";
import moment = require("moment");
import {draftBotInstance} from "../../../../index";

export class PlayerMissionsInfo extends Model {
	declare readonly playerId: number;

	declare gems: number;

	declare hasBoughtPointsThisWeek: boolean;

	declare dailyMissionNumberDone: number;

	declare lastDailyMissionCompleted: Date;

	declare campaignProgression: number;

	declare updatedAt: Date;

	declare createdAt: Date;

	static async resetShopBuyout(): Promise<void> {
		await PlayerMissionsInfo.update(
			{
				hasBoughtPointsThisWeek: false
			}, {where: {}});
	}

	public hasCompletedDailyMission(): boolean {
		return this.lastDailyMissionCompleted && datesAreOnSameDay(this.lastDailyMissionCompleted, new Date());
	}

	public async addGems(amount: number, discordUserId: string, reason: NumberChangeReason): Promise<void> {
		this.gems += amount;
		await this.save();
		draftBotInstance.logsDatabase.logGemsChange(discordUserId, this.gems, reason).then();
	}
}

/**
 * This class is used to treat the missions of a player
 */
export class PlayerMissionsInfos {

	/**
	 * Get the missions of a player
	 * @param playerId
	 */
	public static async getOfPlayer(playerId: number): Promise<PlayerMissionsInfo> {
		return (await PlayerMissionsInfo.findOrCreate({
			where: {
				playerId
			}
		}))[0];
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
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
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