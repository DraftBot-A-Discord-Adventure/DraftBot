import {Sequelize} from "sequelize";
import {LogsItem, logsItemAttributes} from "./LogsItems";

export class LogsItemSellsObject extends LogsItem {
}

export function initModel(sequelize: Sequelize): void {
	LogsItemSellsObject.init(logsItemAttributes, {
		sequelize,
		tableName: "items_sells_object",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
