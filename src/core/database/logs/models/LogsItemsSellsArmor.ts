import {Sequelize} from "sequelize";
import {LogsItem, logsItemAttributes} from "./LogsItems";

export class LogsItemSellsArmor extends LogsItem {
}

export function initModel(sequelize: Sequelize): void {
	LogsItemSellsArmor.init(logsItemAttributes, {
		sequelize,
		tableName: "items_sells_armor",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
