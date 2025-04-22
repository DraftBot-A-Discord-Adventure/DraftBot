import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsPlayersClassChanges extends Model {
	declare readonly playerId: number;

	declare readonly classId: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersClassChanges.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		classId: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_class_changes",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersClassChanges.removeAttribute("id");
}
