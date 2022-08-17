import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayerOccupiedAlteration extends Model {
	public readonly playerId!: number;

	public readonly duration!: number;

	public readonly date!: Date;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerOccupiedAlteration.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		duration: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_occupied_alteration",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayerOccupiedAlteration.removeAttribute("id");
}