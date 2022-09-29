import {DataTypes, QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.createTable("registered_commands", {
		commandName: {
			type: DataTypes.STRING(40), // eslint-disable-line new-cap
			primaryKey: true
		},
		jsonHash: {
			// SHA-1 -> 20 bytes = 40 hex characters
			type: DataTypes.STRING(40) // eslint-disable-line new-cap
		},
		guildCommand: DataTypes.BOOLEAN,
		updatedAt: DataTypes.DATE,
		createdAt: DataTypes.DATE
	});
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.dropTable("registered_commands");
}