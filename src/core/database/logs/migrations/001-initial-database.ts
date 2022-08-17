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
	await context.createTable("players_health", logsPlayerNumberAttributes);
	await context.createTable("players_experience", logsPlayerNumberAttributes);
	await context.createTable("players_score", logsPlayerNumberAttributes);
	await context.createTable("players_gems", logsPlayerNumberAttributes);
	await context.createTable("players_level", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		level: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("commands", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		commandName: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
	await context.createTable("players_commands", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		serverId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		commandId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("servers", {
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
	await context.createTable("small_events", {
		id: {
			type: DataTypes.TINYINT.UNSIGNED,
			primaryKey: true,
			autoIncrement: true
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		}
	});
	await context.createTable("players_small_events", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		smallEventId: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
	await context.createTable("players_big_events", {
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		bigEventId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	});
}

export async function down(context: QueryInterface): Promise<void> {
	await context.dropTable("players");
	await context.dropTable("players_money");
	await context.dropTable("players_health");
	await context.dropTable("players_experience");
	await context.dropTable("players_level");
	await context.dropTable("players_score");
	await context.dropTable("players_gems");
	await context.dropTable("commands");
	await context.dropTable("players_commands");
	await context.dropTable("servers");
	await context.dropTable("small_events");
	await context.dropTable("players_small_events");
	await context.dropTable("players_big_events");
}