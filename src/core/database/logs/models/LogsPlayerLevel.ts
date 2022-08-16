import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayerLevel extends Model {
	public readonly playerId!: number;

	public readonly level!: number;

	public readonly date!: Date;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerLevel.init({
		playerId: DataTypes.INTEGER,
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

	LogsPlayerLevel.removeAttribute("id");
}