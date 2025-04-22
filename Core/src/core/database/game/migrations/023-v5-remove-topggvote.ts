import {
	DataTypes, QueryInterface
} from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("players", "topggVoteAt");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.addColumn("players", "topggVoteAt", DataTypes.DATE);
}
