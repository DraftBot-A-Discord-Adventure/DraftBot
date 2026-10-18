import { QueryInterface } from "sequelize";

/*
 * The server tournament mode was removed before reaching production: databases that ran the
 * former tournament notification migration drop its columns, the others have nothing to clean up.
 */
const TOURNAMENT_NOTIFICATION_COLUMNS = [
	"tournamentEnabled",
	"tournamentSendType",
	"tournamentChannelId"
];

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	const columns = await context.describeTable("notifications");
	for (const column of TOURNAMENT_NOTIFICATION_COLUMNS) {
		if (column in columns) {
			await context.removeColumn("notifications", column);
		}
	}
}

export async function down(): Promise<void> {
	// The tournament mode no longer exists, there is nothing to restore
}
