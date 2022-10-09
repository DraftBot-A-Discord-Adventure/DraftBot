import {DataTypes, QueryInterface} from "sequelize";
import {EntityConstants} from "../../../constants/EntityConstants";
import {entitiesAttributes001} from "./001-initial-database";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	const discordUserIdAttributes = {
		type: DataTypes.STRING(64) // eslint-disable-line new-cap
	};
	const healthAttributes = {
		type: DataTypes.INTEGER,
		defaultValue: EntityConstants.DEFAULT_VALUES.HEALTH
	};
	const fightPointsLostAttributes = {
		type: DataTypes.INTEGER,
		defaultValue: EntityConstants.DEFAULT_VALUES.FIGHT_POINTS_LOST
	};

	await context.addColumn("players", "discordUserId", discordUserIdAttributes);
	await context.addColumn("players", "health", healthAttributes);
	await context.addColumn("players", "fightPointsLost", fightPointsLostAttributes);

	await context.sequelize.query("UPDATE players SET players.discordUserId = (SELECT entities.discordUserId FROM entities WHERE players.entityId = entities.id) WHERE 1");
	await context.sequelize.query("UPDATE players SET players.health = (SELECT entities.health FROM entities WHERE players.entityId = entities.id) WHERE 1");
	await context.sequelize.query("UPDATE players SET players.fightPointsLost = (SELECT entities.fightPointsLost FROM entities WHERE players.entityId = entities.id) WHERE 1");

	await context.dropTable("entities");
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("players", "discordUserId");
	await context.removeColumn("players", "health");
	await context.removeColumn("players", "fightPointsLost");
	await context.createTable("entities", entitiesAttributes001);
}