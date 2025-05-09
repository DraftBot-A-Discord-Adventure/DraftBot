import {
	DataTypes, QueryInterface
} from "sequelize";

const playersRageAttributes = {
	playerId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	value: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	reason: {
		type: DataTypes.TINYINT.UNSIGNED,
		allowNull: false
	},
	date: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false
	}
};

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.createTable("players_rage", playersRageAttributes);
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.dropTable("players_rage");
}
