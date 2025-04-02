import {
	DataTypes, QueryInterface
} from "sequelize";

const guildPointsAttributes = {
	guildId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	points: {
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

const pveFightsResultsAttributes = {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true
	},
	playerId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	monsterId: {
		type: DataTypes.STRING,
		allowNull: false
	},
	monsterLevel: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	monsterFightPoints: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	monsterAttack: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	monsterDefense: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	monsterSpeed: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	turn: {
		type: DataTypes.TINYINT.UNSIGNED,
		allowNull: false
	},
	winner: {
		type: DataTypes.TINYINT.UNSIGNED,
		allowNull: false
	},
	date: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false
	}
};

const pveFightsActionsUsedAttributes = {
	pveFightId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	actionId: {
		type: DataTypes.SMALLINT.UNSIGNED,
		allowNull: false
	},
	count: {
		type: DataTypes.TINYINT,
		allowNull: false
	}
};

export async function up({ context }: { context: QueryInterface }): Promise<void> {
	await context.createTable("guilds_points", guildPointsAttributes);
	await context.createTable("pve_fights_results", pveFightsResultsAttributes);
	await context.createTable("pve_fights_actions_used", pveFightsActionsUsedAttributes);
}

export async function down({ context }: { context: QueryInterface }): Promise<void> {
	await context.dropTable("guilds_points");
	await context.dropTable("pve_fights_results");
	await context.dropTable("pve_fights_actions_used");
}
