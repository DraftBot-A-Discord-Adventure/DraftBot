import {LogsPlayerNumber, logsPlayerNumberAttributes} from "./LogsPlayerNumber";
import {Sequelize} from "sequelize";

export class LogsPlayerMoney extends LogsPlayerNumber {
}

export function initModel(sequelize: Sequelize): void {
	LogsPlayerMoney.init(logsPlayerNumberAttributes, {
		sequelize,
		tableName: "players_money",
		freezeTableName: true,
		timestamps: false
	});

	LogsPlayerMoney.removeAttribute("id");
}