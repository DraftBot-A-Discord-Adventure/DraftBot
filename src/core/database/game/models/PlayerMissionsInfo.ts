import {DataTypes, Model, Sequelize} from "sequelize";
import {datesAreOnSameDay} from "../../../utils/TimeUtils";
import {NumberChangeReason} from "../../logs/LogsDatabase";
import {draftBotInstance} from "../../../bot";
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
 * this class is used to treat the missions of a player
 */
export class PlayerMissionsInfos {

	/**
	 * get the missions of a player
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