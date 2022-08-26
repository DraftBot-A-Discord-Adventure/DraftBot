import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsFightsResults extends Model {
	public readonly id!: number;

	public readonly player1Id!: number;

	public readonly player1Points!: number;

	public readonly player2Id!: number;

	public readonly player2Points!: number;

	public readonly turn!: number;

	public readonly winner!: number;

	public readonly friendly!: boolean;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsFightsResults.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		player1Id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		player1Points: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		player2Id: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		player2Points: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		},
		turn: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		winner: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		friendly: {
			type: DataTypes.BOOLEAN,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "fights_results",
		freezeTableName: true,
		timestamps: false
	});
}