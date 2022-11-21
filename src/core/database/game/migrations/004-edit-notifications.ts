import {DataTypes, QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.changeColumn("players","dmNotification", DataTypes.STRING);
	await context.renameColumn("players","dmNotification","notifications");
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.sequelize.query(`
		UPDATE players
		SET players.notifications = null
		WHERE players.notifications != null
	`);
	await context.changeColumn("players", "notifications", DataTypes.BOOLEAN);
	await context.renameColumn("players", "notifications","dmNotification");
}