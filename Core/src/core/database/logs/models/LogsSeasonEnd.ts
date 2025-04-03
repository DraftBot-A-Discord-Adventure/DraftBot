import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsSeasonEnd extends Model {
	declare readonly date: number;
}

/**
 * Init the model
 * @param sequelize
 */
export function initModel(sequelize: Sequelize): void {
	LogsSeasonEnd.init({
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "season_ends",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
