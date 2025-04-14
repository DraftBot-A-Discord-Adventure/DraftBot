import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPlayersSmallEvents extends Model {
	declare readonly playerId: number;

	declare readonly smallEventId: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersSmallEvents.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		smallEventId: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_small_events",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersSmallEvents.removeAttribute("id");
}
