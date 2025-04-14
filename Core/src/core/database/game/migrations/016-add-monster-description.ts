import {
	DataTypes, QueryInterface
} from "sequelize";
import { MigrationNameChanger } from "../../../../../../Lib/src/database/MigrationNameChanger";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	if (await MigrationNameChanger.changeMigrationName(context, "016-addMonsterDescription.js")) {
		return;
	}

	await context.addColumn("monsters", "descriptionFr", {
		// eslint-disable-next-line new-cap
		type: DataTypes.STRING(512),
		allowNull: false
	});
	await context.addColumn("monsters", "descriptionEn", {
		// eslint-disable-next-line new-cap
		type: DataTypes.STRING(512),
		allowNull: false
	});
	await context.addColumn("monsters", "emoji", {
		// eslint-disable-next-line new-cap
		type: DataTypes.STRING(10),
		allowNull: false
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("monsters", "descriptionFr");
	await context.removeColumn("monsters", "descriptionEn");
	await context.removeColumn("monsters", "emoji");
}
