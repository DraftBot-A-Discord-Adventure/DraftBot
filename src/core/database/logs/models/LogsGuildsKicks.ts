import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsGuildsKicks extends Model {
	public readonly guildId!: number;

	public readonly kickedPlayer!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsKicks.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		kickedPlayer: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_kicks",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}