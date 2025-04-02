import {
	LogsPlayersNumbers, logsPlayersNumbersAttributes
} from "./LogsPlayersNumbers";
import { Sequelize } from "sequelize";

export class LogsPlayersEnergy extends LogsPlayersNumbers {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayersEnergy.init(logsPlayersNumbersAttributes, {
		sequelize,
		tableName: "players_fight_points",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayersEnergy.removeAttribute("id");
}
