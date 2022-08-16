import {LogsPlayerNumber, logsPlayerNumberAttributes} from "./LogsPlayerNumber";
import {Sequelize} from "sequelize";

export class LogsPlayerScore extends LogsPlayerNumber {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerScore.init(logsPlayerNumberAttributes, {
		sequelize,
		tableName: "players_score",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayerScore.removeAttribute("id");
}