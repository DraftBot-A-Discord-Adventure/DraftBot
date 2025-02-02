import {DataTypes, Model, Sequelize} from "sequelize";
import {LogServer} from "./LogServers";
import {LogCommand} from "./LogCommands";
import {LogPlayer} from "./LogPlayers";

export class LogPlayersCommand extends Model {
	declare readonly playerId: number;

	declare readonly serverId: number;

	declare readonly commandId: number;

	declare readonly date: number;
}

export class LogPlayersCommands {
	static async addLog(player: LogPlayer, server: LogServer, command: LogCommand, date: Date): Promise<void> {
		await LogPlayersCommand.create({
			playerId: player.id,
			serverId: server.id,
			commandId: command.id,
			date: date.valueOf() / 1000.0
		});
	}
}

export function initModel(sequelize: Sequelize): void {
	LogPlayersCommand.init({
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
	}, {
		sequelize,
		tableName: "players_commands_logs",
		freezeTableName: true,
		timestamps: false
	});

	LogPlayersCommand.removeAttribute("id");
}