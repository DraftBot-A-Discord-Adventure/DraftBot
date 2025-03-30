import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsFightsResults extends Model {
	declare readonly id: number;

	declare readonly fightInitiatorId: number;

	declare readonly fightInitiatorPoints: number;

	declare readonly player2Id: number;

	declare readonly player2Points: number;

	declare readonly turn: number;

	declare readonly winner: number;

	declare readonly friendly: boolean;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsFightsResults.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		fightInitiatorId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		fightInitiatorPoints: {
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