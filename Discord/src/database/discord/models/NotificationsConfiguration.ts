import {
	DataTypes, Model, Sequelize
} from "sequelize";
import moment = require("moment");
import { NotificationSendTypeEnum } from "../../../notifications/NotificationSendType";

export class NotificationsConfiguration extends Model {
	declare readonly discordId: string;

	declare reportEnabled: boolean;

	declare reportSendType: number;

	declare reportChannelId?: string;

	declare guildDailyEnabled: boolean;

	declare guildDailySendType: number;

	declare guildDailyChannelId?: string;

	declare updatedAt: Date;

	declare createdAt: Date;
}

export class NotificationsConfigurations {
	static async getOrRegister(discordId: string): Promise<NotificationsConfiguration> {
		return (await NotificationsConfiguration.findOrCreate(
			{
				where: {
					discordId
				}
			}
		))[0]; // We don't care about the boolean that findOrCreate returns, so we strip it there
	}
}

export function initModel(sequelize: Sequelize): void {
	NotificationsConfiguration.init({
		discordId: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(32),
			primaryKey: true
		},
		reportEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		reportSendType: {
			type: DataTypes.INTEGER,
			defaultValue: NotificationSendTypeEnum.DM
		},
		reportChannelId: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(32)
		},
		guildDailyEnabled: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		},
		guildDailySendType: {
			type: DataTypes.INTEGER,
			defaultValue: NotificationSendTypeEnum.DM
		},
		guildDailyChannelId: {
			// eslint-disable-next-line new-cap
			type: DataTypes.STRING(32)
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment()
				.format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment()
				.format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "notifications",
		freezeTableName: true
	});

	NotificationsConfiguration.beforeSave(instance => {
		instance.updatedAt = new Date();
	});
}

export default NotificationsConfiguration;
