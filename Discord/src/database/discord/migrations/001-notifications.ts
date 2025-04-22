import {
	DataTypes, QueryInterface
} from "sequelize";
import { NotificationSendTypeEnum } from "../../../notifications/NotificationSendType";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.createTable("notifications", {
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
			defaultValue: new Date()
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: new Date()
		}
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.dropTable("notifications");
}
