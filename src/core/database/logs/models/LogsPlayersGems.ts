import {LogsPlayersNumbers, logsPlayersNumbersAttributes} from "./LogsPlayersNumbers";
import {Sequelize} from "sequelize";

export class LogsPlayersGems extends LogsPlayersNumbers {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersGems.init(logsPlayersNumbersAttributes, {
		sequelize,
		tableName: "players_gems",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersGems.removeAttribute("id");
}