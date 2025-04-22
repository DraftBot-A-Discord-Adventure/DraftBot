import {
	LogsPlayersNumbers, logsPlayersNumbersAttributes
} from "./LogsPlayersNumbers";
import { Sequelize } from "sequelize";

export class LogsPlayersRage extends LogsPlayersNumbers {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersRage.init(logsPlayersNumbersAttributes, {
		sequelize,
		tableName: "players_rage",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersRage.removeAttribute("id");
}
