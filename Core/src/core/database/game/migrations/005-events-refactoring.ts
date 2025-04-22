import { QueryInterface } from "sequelize";
import {
	bigEventsAttributes001,
	eventMapLocationIdsAttributes001,
	possibilitiesAttributes001
} from "./001-initial-database";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.dropTable("events");
	await context.dropTable("possibilities");
	await context.dropTable("event_map_location_ids");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.createTable("events", bigEventsAttributes001);
	await context.createTable("possibilities", possibilitiesAttributes001);
	await context.createTable("event_map_location_ids", eventMapLocationIdsAttributes001);
}
