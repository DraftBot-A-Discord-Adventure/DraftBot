import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsGuildsFoodsChanges extends Model {
	public readonly guildId!: number;

	public readonly food!: number;

	public readonly total!: number;

	public readonly reason!: number;

	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsGuildsFoodsChanges.init({
		guildId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		food: {
			type: DataTypes.TINYINT.UNSIGNED,
			allowNull: false
		},
		total: {
			type: DataTypes.TINYINT.UNSIGNED,
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
		tableName: "guilds_foods_changes",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}