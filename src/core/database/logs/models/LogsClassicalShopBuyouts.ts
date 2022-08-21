import {Sequelize} from "sequelize";
import {LogsShopBuyouts, logsShopLoggingAttributes} from "./LogsShopBuyouts";

export class LogsClassicalShopBuyouts extends LogsShopBuyouts {
}

export function initModel(sequelize: Sequelize): void {
	LogsClassicalShopBuyouts.init(logsShopLoggingAttributes, {
		sequelize,
		tableName: "classical_shop_buyouts",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}