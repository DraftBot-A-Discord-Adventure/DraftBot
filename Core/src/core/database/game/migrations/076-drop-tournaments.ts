import { QueryInterface } from "sequelize";

/*
 * The server tournament mode was removed before reaching production: databases that ran the
 * former tournament migrations drop its tables, the others have nothing to clean up.
 */
const TOURNAMENT_TABLES = [
	"tournament_fights",
	"tournament_participants",
	"tournaments",
	"tournament_codes"
];

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	for (const table of TOURNAMENT_TABLES) {
		await context.dropTable(table);
	}
}

export async function down(): Promise<void> {
	// The tournament mode no longer exists, there is nothing to restore
}
