import {Sequelize} from "sequelize";
import {LogsItem, logsItemAttributes} from "./LogsItems";

export class LogsPlayersDailies extends LogsItem {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersDailies.init(logsItemAttributes, {
		sequelize,
		tableName: "players_dailies",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
