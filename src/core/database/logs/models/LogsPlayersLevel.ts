import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayersLevel extends Model {
	public readonly playerId!: number;

	public readonly level!: number;

	public readonly date!: Date;
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