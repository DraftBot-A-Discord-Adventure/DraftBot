import {LogsPlayersNumbers, logsPlayersNumbersAttributes} from "./LogsPlayersNumbers";
import {Sequelize} from "sequelize";

export class LogsPlayersExperience extends LogsPlayersNumbers {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersExperience.init(logsPlayersNumbersAttributes, {
		sequelize,
		tableName: "players_experience",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersExperience.removeAttribute("id");
}