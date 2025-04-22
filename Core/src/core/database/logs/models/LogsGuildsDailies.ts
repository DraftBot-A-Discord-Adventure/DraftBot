import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsGuildsDailies extends Model {
	declare readonly guildId: number;

	declare readonly reward: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsDailies.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		reward: {
			type: DataTypes.TINYINT,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_dailies",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
