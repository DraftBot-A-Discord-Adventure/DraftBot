import {
	DataTypes, QueryInterface
} from "sequelize";
import { MigrationNameChanger } from "../../../../../../Lib/src/database/MigrationNameChanger";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	if (await MigrationNameChanger.changeMigrationName(context, "007-missionPoints.js")) {
		return;
	}

	await context.addColumn("mission_slots", "pointsToWin", DataTypes.INTEGER);
	await context.addColumn("daily_mission", "pointsToWin", DataTypes.INTEGER);
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("mission_slots", "pointsToWin");
	await context.removeColumn("daily_mission", "pointsToWin");
}
