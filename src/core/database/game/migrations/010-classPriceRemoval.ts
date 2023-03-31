import {QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	// Up classes
	await context.sequelize.query(`
		ALTER TABLE classes
		DROP COLUMN price
	`);
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	// Up classes
	await context.sequelize.query(`
		ALTER TABLE classes
		ADD COLUMN price INTEGER NOT NULL DEFAULT 0
	`);
}