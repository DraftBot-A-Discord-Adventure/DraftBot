import {
	DataTypes, QueryInterface
} from "sequelize";
import { MigrationNameChanger } from "../../../../../../Lib/src/database/MigrationNameChanger";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	// Renumbered after the 075 and 076 migrations of develop: a database that already ran it under its former name skips it
	if (await MigrationNameChanger.changeMigrationName(context, "078-guild-recruitment.js")) {
		return;
	}

	await context.addColumn("guilds", "recruitmentOfficeLevel", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0
	});
	await context.addColumn("guilds", "recruitmentOpen", {
		type: DataTypes.BOOLEAN,
		allowNull: false,
		defaultValue: false
	});
	await context.addColumn("guilds", "recruitmentMinScore", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 0
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("guilds", "recruitmentMinScore");
	await context.removeColumn("guilds", "recruitmentOpen");
	await context.removeColumn("guilds", "recruitmentOfficeLevel");
}
