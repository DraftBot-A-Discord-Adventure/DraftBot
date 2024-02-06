import {LogsPlayersNumbers, logsPlayersNumbersAttributes} from "./LogsPlayersNumbers";
import {Sequelize} from "sequelize";

export class LogsPlayersMoney extends LogsPlayersNumbers {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersMoney.init(logsPlayersNumbersAttributes, {
		sequelize,
		tableName: "players_money",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersMoney.removeAttribute("id");
}