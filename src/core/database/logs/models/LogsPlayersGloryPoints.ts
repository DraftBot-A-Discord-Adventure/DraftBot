import {DataTypes, Model, Sequelize} from "sequelize";

/**
 * @class LogsPlayersGloryPoints
 */
export class LogsPlayersGloryPoints extends Model {
	public readonly playerId!: number;

	public readonly value!: number;

	public readonly reason!: string;

	public readonly fightId!: number;

	public readonly date!: number;
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