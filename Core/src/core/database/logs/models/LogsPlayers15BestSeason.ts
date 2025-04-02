import {
	DataTypes, Model, Sequelize
} from "sequelize";

/**
 * @class LogsPlayers15BestSeason
 */
export class LogsPlayers15BestSeason extends Model {
	declare readonly playerId: number;

	declare readonly position: number;

	declare readonly seasonGlory: number;

	declare readonly date: number;
}

/**
 * Init the model
 * @param sequelize
 */
export function initModel(sequelize: Sequelize): void {
	LogsPlayers15BestSeason.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		position: {
			type: DataTypes.TINYINT,
			allowNull: false
		},
		seasonGlory: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_15_best_season",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayers15BestSeason.removeAttribute("id");
}
