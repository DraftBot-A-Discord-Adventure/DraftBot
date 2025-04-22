import { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.renameColumn("daily_mission", "objective", "missionObjective");
	await context.renameColumn("daily_mission", "variant", "missionVariant");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.renameColumn("daily_mission", "missionObjective", "objective");
	await context.renameColumn("daily_mission", "missionVariant", "variant");
}
