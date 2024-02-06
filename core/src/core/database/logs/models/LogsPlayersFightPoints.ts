import {LogsPlayersNumbers, logsPlayersNumbersAttributes} from "./LogsPlayersNumbers";
import {Sequelize} from "sequelize";

export class LogsPlayersFightPoints extends LogsPlayersNumbers {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersFightPoints.init(logsPlayersNumbersAttributes, {
		sequelize,
		tableName: "players_fight_points",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersFightPoints.removeAttribute("id");
}