import {
	DataTypes, QueryInterface
} from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("players", "notifications");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("players", "notifications", {
		type: DataTypes.STRING,
		allowNull: true,
		defaultValue: "-1"
	});
}
