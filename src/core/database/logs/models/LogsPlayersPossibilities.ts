import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsPlayersPossibilities extends Model {
	public readonly playerId!: number;

	public readonly bigEventId!: number;

	public readonly possibilityId!: number;

	public readonly date!: Date;
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersPossibilities.init({
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		possibilityId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "players_possibilities",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersPossibilities.removeAttribute("id");
}