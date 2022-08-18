import {Sequelize} from "sequelize";
import {LogsItem, logsItemAttributes} from "./LogsItems";

export class LogsItemSellsWeapon extends LogsItem {
}

export function initModel(sequelize: Sequelize): void {
	LogsItemSellsWeapon.init(logsItemAttributes, {
		sequelize,
		tableName: "items_sells_weapon",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
