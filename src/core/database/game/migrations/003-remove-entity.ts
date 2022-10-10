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
		UPDATE draftbot_game.players, draftbot_game.entities
		SET draftbot_game.players.discordUserId   = draftbot_game.entities.discordUserId,
			draftbot_game.players.health          = draftbot_game.entities.health,
			draftbot_game.players.fightPointsLost = draftbot_game.entities.fightPointsLost
		WHERE draftbot_game.players.id = draftbot_game.entities.id
	`);


	await context.removeColumn("players", "entityId");
	await context.dropTable("entities");
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.removeColumn("players", "discordUserId");
	await context.removeColumn("players", "health");
	await context.removeColumn("players", "fightPointsLost");
	await context.createTable("entities", entitiesAttributes001);
	await context.addColumn("players", "entityId", {
		type: DataTypes.INTEGER,
		allowNull: false
	});
}