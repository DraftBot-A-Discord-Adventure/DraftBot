import {LogsPlayersNumbers, logsPlayersNumbersAttributes} from "./LogsPlayersNumbers";
import {Sequelize} from "sequelize";

export class LogsPlayersHealth extends LogsPlayersNumbers {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersHealth.init(logsPlayersNumbersAttributes, {
		sequelize,
		tableName: "players_health",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersHealth.removeAttribute("id");
}