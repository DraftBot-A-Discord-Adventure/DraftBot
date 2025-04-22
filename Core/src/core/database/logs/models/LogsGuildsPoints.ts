import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsGuildsPoints extends Model {
	declare readonly guildId: number;

	declare readonly points: number;

	declare readonly reason: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsPoints.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		points: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		reason: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_points",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
