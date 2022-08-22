import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsGuildsLeaves extends Model {
	public readonly guildId!: number;

	public readonly leftPlayer: number;

	public readonly date: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsLeaves.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		leftPlayer: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "guilds_leaves",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}