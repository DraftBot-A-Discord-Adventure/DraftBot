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

	// we need to move some columns from the entity table to the players table : discordUserId, health, fightPointsLost
	await context.addColumn("players", "discordUserId", discordUserIdAttributes);
	await context.addColumn("players", "health", healthAttributes);
	await context.addColumn("players", "fightPointsLost", fightPointsLostAttributes);

	// then we need to copy the data from the entity table to the players table
	await context.sequelize.query(`
		UPDATE players, entities
		SET players.discordUserId   = entities.discordUserId,
			players.health          = entities.health,
			players.fightPointsLost = entities.fightPointsLost
		WHERE players.id = entities.id
	`);

	await context.removeColumn("players", "entityId");
	await context.dropTable("entities");
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.createTable("entities", entitiesAttributes001);
	await context.addColumn("players", "entityId", {
		type: DataTypes.INTEGER
	});
	await context.sequelize.query(`
		INSERT INTO entities
		SELECT NULL, 100, players.health, 0, 0, 0, players.fightPointsLost, players.discordUserId, updatedAt, createdAt
		FROM players
	`);
	await context.sequelize.query(`
		UPDATE players, entities
		SET players.entityId = entities.id
		WHERE players.discordUserId = entities.discordUserId
	`);

	await context.removeColumn("players", "discordUserId");
	await context.removeColumn("players", "health");
	await context.removeColumn("players", "fightPointsLost");
}