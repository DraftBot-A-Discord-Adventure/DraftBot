import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayersCommands extends Model {
	public readonly playerId!: number;

	public readonly serverId!: number;

	public readonly commandId!: number;

	public readonly date!: Date;
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