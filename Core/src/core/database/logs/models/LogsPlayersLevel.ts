import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPlayersLevel extends Model {
	declare readonly playerId: number;

	declare readonly level: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersLevel.init({
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
	}, {
		sequelize,
		tableName: "players_level",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersLevel.removeAttribute("id");
}
