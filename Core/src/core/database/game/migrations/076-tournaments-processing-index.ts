import { QueryInterface } from "sequelize";

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	/*
	 * The 10-minute tournament processing filters on status and endedNotificationSent across every guild:
	 * the (discordGuildId, status) index cannot serve it, and finished tournaments accumulate forever
	 */
	await context.addIndex("tournaments", ["status", "endedNotificationSent"], {
		name: "idx_tournaments_status_ended_notification"
	});
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.removeIndex("tournaments", "idx_tournaments_status_ended_notification");
}
