import {Sequelize} from "sequelize";
import {LogsShopBuyouts, logsShopLoggingAttributes} from "./LogsShopBuyouts";

export class LogsMissionShopBuyouts extends LogsShopBuyouts {
}

export function initModel(sequelize: Sequelize): void {
	LogsMissionShopBuyouts.init(logsShopLoggingAttributes, {
		sequelize,
		tableName: "mission_shop_buyouts",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}