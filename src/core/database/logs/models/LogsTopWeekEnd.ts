import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsTopWeekEnd extends Model {
	public readonly date!: number;
}

/**
 * Init the model
 * @param sequelize
 */
export function initModel(sequelize: Sequelize): void {
	LogsTopWeekEnd.init({
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "top_week_ends",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}