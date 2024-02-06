import {Sequelize} from "sequelize";
import {LogsItem, logsItemAttributes} from "./LogsItems";

export class LogsItemGainsWeapon extends LogsItem {
}

export function initModel(sequelize: Sequelize): void {
	LogsItemGainsWeapon.init(logsItemAttributes, {
		sequelize,
		tableName: "items_gains_weapon",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
