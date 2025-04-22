import {
	DataTypes, QueryInterface
} from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("classes", "baseBreath", DataTypes.INTEGER);
	await context.addColumn("classes", "maxBreath", DataTypes.INTEGER);
	await context.addColumn("classes", "breathRegen", DataTypes.INTEGER);
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("classes", "baseBreath");
	await context.removeColumn("classes", "maxBreath");
	await context.removeColumn("classes", "breathRegen");
}
