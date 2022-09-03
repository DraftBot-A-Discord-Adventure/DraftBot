import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsGuildsCreations extends Model {
	public readonly guildId!: number;

	public readonly creatorId!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsCreations.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		creatorId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_creations",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}