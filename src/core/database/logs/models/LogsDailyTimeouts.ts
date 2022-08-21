import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsDailyTimeouts extends Model {
	public readonly date!: number;
}

export function initModel(sequelize: Sequelize): void {
	LogsDailyTimeouts.init({
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "daily_timeouts",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}