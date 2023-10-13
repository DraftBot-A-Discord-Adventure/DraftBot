import {Sequelize} from "sequelize";
import {LogsItem, logsItemAttributes} from "./LogsItems";

export class LogsItemGainsArmor extends LogsItem {
}

export function initModel(sequelize: Sequelize): void {
	LogsItemGainsArmor.init(logsItemAttributes, {
		sequelize,
		tableName: "items_gains_armor",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
