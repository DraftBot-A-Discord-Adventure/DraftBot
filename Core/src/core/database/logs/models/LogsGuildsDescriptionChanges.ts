import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsGuildsDescriptionChanges extends Model {
	declare readonly guildId: number;

	declare readonly playerId: number;

	declare readonly description: string;

	declare readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsDescriptionChanges.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		playerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		description: DataTypes.STRING,
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_descriptions_changes",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
