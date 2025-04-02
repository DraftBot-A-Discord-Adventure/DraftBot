import {
	DataTypes, Model, Sequelize
} from "sequelize";

/**
 * @class LogsPlayersGloryPoints
 */
export class LogsPlayersGloryPoints extends Model {
	declare readonly playerId: number;

	declare readonly value: number;

	declare readonly reason: string;

	declare readonly fightId: number;

	declare readonly date: number;
}

/**
 * Init the model
 * @param sequelize
 */
export function initModel(sequelize: Sequelize): void {
	LogsPlayersGloryPoints.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		value: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		fightId: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_glory_points",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersGloryPoints.removeAttribute("id");
}
