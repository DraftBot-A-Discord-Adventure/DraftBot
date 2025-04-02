import {
	DataTypes, Model
} from "sequelize";

export class LogsShopBuyouts extends Model {
	declare readonly playerId: number;

	declare readonly shopItem: number;

	declare readonly date: number;
}

export const logsShopLoggingAttributes = {
	playerId: {
		type: DataTypes.INTEGER,
		allowNull: false
	},
	shopItem: {
		type: DataTypes.TINYINT,
		allowNull: false
	},
	date: {
		type: DataTypes.INTEGER.UNSIGNED,
		allowNull: false
	}
};
