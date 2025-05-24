import {
	DataTypes, QueryInterface
} from "sequelize";
import { NotificationSendTypeEnum } from "../../../notifications/NotificationSendType";

export async function up(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.addColumn("notifications", "fightChallengeEnabled", {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: true
	});
	await queryInterface.addColumn("notifications", "fightChallengeSendType", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: NotificationSendTypeEnum.DM
	});
	return queryInterface.addColumn("notifications", "fightChallengeChannelId", {
		type: DataTypes.STRING(32), // eslint-disable-line new-cap
		allowNull: true,
		defaultValue: null
	});
}

export async function down(queryInterface: QueryInterface): Promise<void> {
	await queryInterface.removeColumn("notifications", "fightChallengeEnabled");
	await queryInterface.removeColumn("notifications", "fightChallengeSendType");
	return queryInterface.removeColumn("notifications", "fightChallengeChannelId");
}
