import {LogsPlayerNumber, logsPlayerNumberAttributes} from "./LogsPlayerNumber";
import {Sequelize} from "sequelize";

export class LogsPlayerHealth extends LogsPlayerNumber {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerHealth.init(logsPlayerNumberAttributes, {
		sequelize,
		tableName: "players_health",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayerHealth.removeAttribute("id");
}