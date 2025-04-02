import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsGuildsKicks extends Model {
	declare readonly guildId: number;

	declare readonly kickedPlayer: number;

	declare readonly date: number;
}

/**
 * Init the model
 * @param sequelize
 */
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
