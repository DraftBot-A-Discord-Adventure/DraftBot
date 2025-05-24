import {
	DataTypes, QueryInterface
} from "sequelize";
import { NotificationSendTypeEnum } from "../../../notifications/NotificationSendType";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("notifications", "fightChallengeEnabled", {
		type: DataTypes.BOOLEAN,
		defaultValue: true
	});
	await context.addColumn("notifications", "fightChallengeSendType", {
		type: DataTypes.INTEGER,
		defaultValue: NotificationSendTypeEnum.DM
	});
	return context.addColumn("notifications", "fightChallengeChannelId", {
		type: DataTypes.STRING(32) // eslint-disable-line new-cap
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("notifications", "fightChallengeEnabled");
	await context.removeColumn("notifications", "fightChallengeSendType");
	return context.removeColumn("notifications", "fightChallengeChannelId");
}
