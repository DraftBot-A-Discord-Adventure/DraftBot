import {
	DataTypes, Model
} from "sequelize";

export abstract class LogsPlayersNumbers extends Model {
	declare readonly playerId: number;

	declare readonly value: number;

	declare readonly reason: string;

	declare readonly date: number;
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
