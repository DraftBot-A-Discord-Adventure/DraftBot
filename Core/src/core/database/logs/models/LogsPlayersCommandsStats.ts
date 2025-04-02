import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPlayersCommandsStats extends Model {
	declare readonly playerId?: number;

	declare readonly originId: number;

	declare readonly subOriginId: number;

	declare readonly commandId: number;

	declare readonly year: number;

	declare readonly week: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersCommandsStats.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		originId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		subOriginId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		commandId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		year: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		week: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		count: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_commands_stats",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersCommandsStats.removeAttribute("id");
}
