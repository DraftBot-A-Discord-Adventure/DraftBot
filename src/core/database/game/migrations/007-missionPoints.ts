import {DataTypes, QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.addColumn("mission_slots", "pointsToWin", DataTypes.INTEGER);
	await context.addColumn("daily_mission", "pointsToWin", DataTypes.INTEGER);
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("mission_slots", "pointsToWin");
	await context.removeColumn("daily_mission", "pointsToWin");
}