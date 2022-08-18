import {DataTypes, Model} from "sequelize";

export abstract class LogsPlayersNumbers extends Model {
	public readonly playerId!: number;

	public readonly value!: number;

	public readonly reason!: string;

	public readonly date!: Date;
}

export const logsPlayersNumbersAttributes = {
	playerId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	value: {
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
};