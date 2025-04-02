import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPlayersTimewarps extends Model {
	declare readonly playerId: number;

	declare readonly time: number;

	declare readonly reason: number;

	declare readonly date: number;
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
