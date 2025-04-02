import {
	DataTypes, QueryInterface
} from "sequelize";
import { MigrationNameChanger } from "../../../../../../Lib/src/database/MigrationNameChanger";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	if (await MigrationNameChanger.changeMigrationName(context, "015-addMonsetAttackWeight.js")) {
		return;
	}

	await context.addColumn("monster_attacks", "weight", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 1
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("monster_attacks", "weight");
}
