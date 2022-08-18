import {Sequelize} from "sequelize";
import {LogsItem, logsItemAttributes} from "./LogsItems";

export class LogsItemGainsPotion extends LogsItem {
}

export function initModel(sequelize: Sequelize): void {
	LogsItemGainsPotion.init(logsItemAttributes, {
		sequelize,
		tableName: "items_gains_potion",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
