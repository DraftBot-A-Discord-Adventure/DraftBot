import {Sequelize} from "sequelize";
import {LogsItem, logsItemAttributes} from "./LogsItems";

export class LogsItemSellsPotion extends LogsItem {
}

export function initModel(sequelize: Sequelize): void {
	LogsItemSellsPotion.init(logsItemAttributes, {
		sequelize,
		tableName: "items_sells_potion",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
