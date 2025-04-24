import {
	DataTypes, QueryInterface
} from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn(
		"players_glory_points",
		"isDefense",
		{
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	);
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("players_glory_points", "isDefense");
}
