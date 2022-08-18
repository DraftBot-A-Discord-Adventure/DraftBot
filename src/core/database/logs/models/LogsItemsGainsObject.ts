import {Sequelize} from "sequelize";
import {LogsItem, logsItemAttributes} from "./LogsItems";

export class LogsItemGainsObject extends LogsItem {
}

export function initModel(sequelize: Sequelize): void {
	LogsItemGainsObject.init(logsItemAttributes, {
		sequelize,
		tableName: "items_gains_object",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
