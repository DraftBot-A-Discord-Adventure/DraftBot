import { DataTypes, QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.createTable("dwarf_pets_seen", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		},
		petTypeId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true
		}
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.dropTable("dwarf_pets_seen");
}
