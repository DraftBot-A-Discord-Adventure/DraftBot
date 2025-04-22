import {
	DataTypes, QueryInterface
} from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	// Change settings column from integer to bigint
	await context.changeColumn("settings", "dataNumber", {
		type: DataTypes.BIGINT,
		allowNull: false
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	// Change settings column from bigint to integer
	await context.changeColumn("settings", "dataNumber", {
		type: DataTypes.INTEGER,
		allowNull: false
	});
}
