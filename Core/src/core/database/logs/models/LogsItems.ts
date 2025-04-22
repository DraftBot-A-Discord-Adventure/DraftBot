import {
	DataTypes, Model
} from "sequelize";

export abstract class LogsItem extends Model {
	declare readonly playerId: number;

	declare readonly itemId: number;

	declare readonly name: string;
}

export const logsItemAttributes = {
	playerId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	itemId: {
		type: DataTypes.SMALLINT.UNSIGNED,
		allowNull: false
	},
	date: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false
	}
};
