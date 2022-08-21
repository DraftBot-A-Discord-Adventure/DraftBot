import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayersStandardAlterations extends Model {
	public readonly playerId!: number;

	public readonly alterationId!: number;

	public readonly reason!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersStandardAlterations.init({
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
		tableName: "players_standard_alterations",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersStandardAlterations.removeAttribute("id");
}