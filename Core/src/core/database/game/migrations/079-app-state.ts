import {
	DataTypes, QueryInterface
} from "sequelize";
import { MigrationNameChanger } from "../../../../../../Lib/src/database/MigrationNameChanger";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	// Renumbered after the 075 and 076 migrations of develop: a database that already ran it under its former name skips it
	if (await MigrationNameChanger.changeMigrationName(context, "077-app-state.js")) {
		return;
	}

	await context.addColumn("player_missions_info", "appSeen", {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false,
		defaultValue: 0
	});
	await context.addColumn("player_missions_info", "pendingReveals", {
		type: DataTypes.TEXT,
		allowNull: true,
		defaultValue: null
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("player_missions_info", "pendingReveals");
	await context.removeColumn("player_missions_info", "appSeen");
}
