import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsGuildsDestroys extends Model {
	declare readonly guildId: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsDestroys.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_destroys",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
