import {
	DataTypes, Model, Sequelize
} from "sequelize";

export class LogsUnlocks extends Model {
	declare readonly buyerId: number;

	declare readonly releasedId: number;

	declare readonly date: number;
}

/**
 * Init the model
 * @param sequelize
 */
export function initModel(sequelize: Sequelize): void {
	LogsUnlocks.init({
		buyerId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		releasedId: {
			type: DataTypes.INTEGER,
			allowNull: false
		},
		date: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false
		}
	}, {
		sequelize,
		tableName: "unlocks",
		freezeTableName: true,
		timestamps: false
	});

	LogsUnlocks.removeAttribute("id");
}
