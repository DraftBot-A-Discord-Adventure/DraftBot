import {DataTypes, Model, Sequelize} from "sequelize";
import {LogPlayer} from "./LogPlayers";

export class LogCommandStat extends Model {
	declare readonly id: number;

	declare readonly commandId: string;

	declare readonly count: number;
}

export function initModel(sequelize: Sequelize): void {
	LogPlayer.init({
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		commandId: {
			type: DataTypes.STRING,
			allowNull: false
		},
		count: {
			type: DataTypes.INTEGER,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "command_stats_logs",
		freezeTableName: true,
		timestamps: false
	});
}