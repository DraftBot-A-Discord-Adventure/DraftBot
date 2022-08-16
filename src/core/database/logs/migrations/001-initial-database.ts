import {DataTypes, QueryInterface} from "sequelize";

export const logsPlayerNumberAttributes = {
	playerId: DataTypes.INTEGER,
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

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.createTable("players", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		discordId: {
			type: DataTypes.STRING(20), // eslint-disable-line new-cap
			allowNull: false
		}
	});
	await context.createTable("players_money", logsPlayerNumberAttributes);
}

export async function down(context: QueryInterface): Promise<void> {
	await context.dropTable("players");
	await context.dropTable("players_money");
}