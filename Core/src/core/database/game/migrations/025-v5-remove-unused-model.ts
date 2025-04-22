import { QueryInterface } from "sequelize";
import { serversAttributes001 } from "./001-initial-database";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.dropTable("servers");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.createTable("servers", serversAttributes001);
}
