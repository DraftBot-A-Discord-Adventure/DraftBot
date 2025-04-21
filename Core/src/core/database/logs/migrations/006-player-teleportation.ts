import {
	DataTypes, QueryInterface
} from "sequelize";

const playersTeleportationsAttributes = {
	playerId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	originMapLinkId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	newMapLinkId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	date: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false
	}
};

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.createTable("players_teleportations", playersTeleportationsAttributes);
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.dropTable("players_teleportations");
}
