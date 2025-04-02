import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsGuildsChiefsChanges extends Model {
	declare readonly guildId: number;

	declare readonly newChief: number;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsChiefsChanges.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		newChief: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_chiefs_changes",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
