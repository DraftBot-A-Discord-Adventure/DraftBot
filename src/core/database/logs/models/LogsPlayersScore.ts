import {LogsPlayersNumbers, logsPlayersNumbersAttributes} from "./LogsPlayersNumbers";
import {Sequelize} from "sequelize";

export class LogsPlayersScore extends LogsPlayersNumbers {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersScore.init(logsPlayersNumbersAttributes, {
		sequelize,
		tableName: "players_score",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersScore.removeAttribute("id");
}