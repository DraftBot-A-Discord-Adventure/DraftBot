import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsDailyPotions extends Model {
	declare readonly potionId: number;

	declare readonly date: number;
}

/**
 * Init the model
 * @param sequelize
 */
export function initModel(sequelize: Sequelize): void {
	LogsDailyPotions.init({
		potionId: {
			type: DataTypes.SMALLINT.UNSIGNED,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "daily_potions",
		freezeTableName: true,
		timestamps: false
	}).removeAttribute("id");
}
