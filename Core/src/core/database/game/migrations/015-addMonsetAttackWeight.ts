import {DataTypes, QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.addColumn("monster_attacks", "weight", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 1
	});
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("monster_attacks", "weight");
}