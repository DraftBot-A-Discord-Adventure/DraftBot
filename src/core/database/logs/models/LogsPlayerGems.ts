import {LogsPlayerNumber, logsPlayerNumberAttributes} from "./LogsPlayerNumber";
import {Sequelize} from "sequelize";

export class LogsPlayerGems extends LogsPlayerNumber {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerGems.init(logsPlayerNumberAttributes, {
		sequelize,
		tableName: "players_gems",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayerGems.removeAttribute("id");
}