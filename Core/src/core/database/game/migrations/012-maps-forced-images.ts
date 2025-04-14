import {
	DataTypes, QueryInterface
} from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("map_locations", "forcedImage", {
		type: DataTypes.TEXT,
		allowNull: true
	});
	await context.addColumn("map_links", "forcedImage", {
		type: DataTypes.TEXT,
		allowNull: true
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("map_locations", "forcedImage");
	await context.removeColumn("map_links", "forcedImage");
}
