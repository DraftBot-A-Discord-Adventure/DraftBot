import { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.renameColumn("fights_results", "player1Id", "fightInitiatorId");
	await context.renameColumn("fights_results", "player1Points", "fightInitiatorPoints");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.renameColumn("fights_results", "fightInitiatorId", "player1Id");
	await context.renameColumn("fights_results", "fightInitiatorPoints", "player1Points");
}
