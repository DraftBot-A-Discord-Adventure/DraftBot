import {DataTypes, Sequelize} from "sequelize";
import {LogsShopBuyouts, logsShopLoggingAttributes} from "./LogsShopBuyouts";

export class LogsGuildShopBuyouts extends LogsShopBuyouts {
	public readonly amount!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildShopBuyouts.init({
		...logsShopLoggingAttributes,
		amount: {
			type: DataTypes.TINYINT,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guild_shop_buyouts",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}