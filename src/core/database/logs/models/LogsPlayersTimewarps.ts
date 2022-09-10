import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayersTimewarps extends Model {
	public readonly playerId!: number;

	public readonly time!: number;

	public readonly reason!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersTimewarps.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		time: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_timewarps",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersTimewarps.removeAttribute("id");
}