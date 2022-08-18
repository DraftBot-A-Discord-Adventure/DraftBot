import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayersClassChanges extends Model {
	public readonly playerId!: number;

	public readonly classId!: number;

	public readonly date!: Date;
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