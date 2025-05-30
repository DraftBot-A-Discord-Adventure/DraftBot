import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPlayersOccupiedAlterations extends Model {
	declare readonly playerId: number;

	declare readonly duration: number;

	declare readonly reason: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersOccupiedAlterations.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		duration: {
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
		tableName: "players_occupied_alterations",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersOccupiedAlterations.removeAttribute("id");
}
