import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayerStandardAlteration extends Model {
	public readonly playerId!: number;

	public readonly alterationId!: number;

	public readonly reason!: number;

	public readonly date!: Date;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerStandardAlteration.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		alterationId: {
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
		tableName: "players_standard_alteration",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayerStandardAlteration.removeAttribute("id");
}