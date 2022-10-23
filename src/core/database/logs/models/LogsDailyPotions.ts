import {DataTypes, Model, Sequelize} from "sequelize";

export class LogsDailyPotions extends Model {
	public readonly potionId!: number;

	public readonly date!: number;
}

/**
 * init the model
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