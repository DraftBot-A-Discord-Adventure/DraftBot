import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayersCommands extends Model {
	declare readonly playerId: number;

	declare readonly serverId: number;

	declare readonly commandId: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersCommands.init({
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
		tableName: "players_commands",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersCommands.removeAttribute("id");
}