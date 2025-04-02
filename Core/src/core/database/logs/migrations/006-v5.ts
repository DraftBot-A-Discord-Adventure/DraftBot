import {
	DataTypes, QueryInterface
} from "sequelize";
import { Effect } from "../../../../../../Lib/src/types/Effect";

/*
 * Populated by v5 migration of game
 * Map discordId => new ID
 */
export const logsV5NewIds = new Map<string, string>();

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.sequelize.query("ALTER TABLE players MODIFY COLUMN discordId VARCHAR(64)");

	for (const id of logsV5NewIds.entries()) {
		await context.sequelize.query(`UPDATE players SET discordId = "${id[1]}" WHERE discordId = "${id[0]}"`);
	}

	await context.renameColumn("players", "discordId", "keycloakId");

	// Change alterations name in logs
	for (const effect of Effect.getAll()) {
		await context.sequelize.query(`UPDATE alterations SET alteration = "${effect.id}" WHERE alteration = "${effect.v4Id}"`);
	}

	// Extend logs possibilities emote length + rename
	await context.changeColumn("possibilities", "emote", DataTypes.STRING(256)); // eslint-disable-line new-cap
	await context.renameColumn("possibilities", "emote", "possibilityName");
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.renameColumn("players", "keycloakId", "gameId");
}
