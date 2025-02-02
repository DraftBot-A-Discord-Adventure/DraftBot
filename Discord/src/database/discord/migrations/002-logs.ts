import {DataTypes, QueryInterface} from "sequelize";

export async function up({context}: { context: QueryInterface }): Promise<void> {
	await context.createTable("server_join_logs", {
		serverId: {
			type: DataTypes.INTEGER
		},
		serverName: {
			type: DataTypes.TEXT
		},
		membersCount: {
			type: DataTypes.INTEGER
		}
	});
	await context.createTable("server_leave_logs", {
		serverId: {
			type: DataTypes.INTEGER
		},
		serverName: {
			type: DataTypes.TEXT
		},
		membersCount: {
			type: DataTypes.INTEGER
		}
	});
	await context.createTable("command_logs", {
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
	await context.createTable("command_stats_logs", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		commandId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		count: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	});
	await context.createTable("players_logs", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		discordId: {
			type: DataTypes.STRING(64), // eslint-disable-line new-cap
			allowNull: false
		}
	});
	await context.createTable("players_commands_logs", {
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
	await context.createTable("servers_logs", {
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
}

export async function down({context}: { context: QueryInterface }): Promise<void> {
	await context.dropTable("server_join_logs");
	await context.dropTable("server_leave_logs");
	await context.dropTable("command_logs");
	await context.dropTable("command_stats_logs");
	await context.dropTable("players_logs");
	await context.dropTable("players_commands_logs");
	await context.dropTable("servers");
}