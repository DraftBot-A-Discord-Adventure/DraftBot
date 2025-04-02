import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPlayers15BestTopweek extends Model {
	declare readonly playerId: number;

	declare readonly position: number;

	declare readonly topWeekScore: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayers15BestTopweek.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		position: {
			type: DataTypes.TINYINT,
			allowNull: false
		},
		topWeekScore: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_15_best_topweek",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayers15BestTopweek.removeAttribute("id");
}
