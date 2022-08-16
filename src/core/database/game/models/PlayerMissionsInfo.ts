import {DataTypes, Model, Sequelize} from "sequelize";
import {datesAreOnSameDay} from "../../../utils/TimeUtils";
import Entity from "./Entity";
import moment = require("moment");
import {NumberChangeReason} from "../../logs/LogsDatabase";
import {draftBotInstance} from "../../../bot";

export class PlayerMissionsInfo extends Model {
	public readonly playerId!: number;

	public gems!: number;

	public hasBoughtPointsThisWeek!: boolean;

	public dailyMissionNumberDone!: number;

	public lastDailyMissionCompleted!: Date;

	public campaignProgression!: number;

	public updatedAt!: Date;

	public createdAt!: Date;

	static async resetShopBuyout() {
		await PlayerMissionsInfo.update(
			{
				hasBoughtPointsThisWeek: false
			}, {where: {}});
	}

	public hasCompletedDailyMission(): boolean {
		return this.lastDailyMissionCompleted && datesAreOnSameDay(this.lastDailyMissionCompleted, new Date());
	}

	public async addGems(amount: number, entity: Entity, reason: NumberChangeReason): Promise<void> {
		this.gems += amount;
		await entity.Player.PlayerMissionsInfo.save();
		draftBotInstance.logsDatabase.logGemsChange(entity.discordUserId, this.gems, reason).then();
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