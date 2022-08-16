import {LogsPlayerNumber, logsPlayerNumberAttributes} from "./LogsPlayerNumber";
import {Sequelize} from "sequelize";

export class LogsPlayerExperience extends LogsPlayerNumber {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerExperience.init(logsPlayerNumberAttributes, {
		sequelize,
		tableName: "players_experience",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayerExperience.removeAttribute("id");
}