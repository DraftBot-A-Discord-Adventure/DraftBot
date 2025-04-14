import { QueryInterface } from "sequelize";
import { MigrationNameChanger } from "../../../../../../Lib/src/database/MigrationNameChanger";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	if (await MigrationNameChanger.changeMigrationName(context, "010-classPriceRemoval.js")) {
		return;
	}

	// Up classes
	await context.sequelize.query(`
		ALTER TABLE classes
		DROP COLUMN price
	`);
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	// Down classes
	await context.sequelize.query(`
		ALTER TABLE classes
		ADD COLUMN price INTEGER NOT NULL DEFAULT 0
	`);
}
