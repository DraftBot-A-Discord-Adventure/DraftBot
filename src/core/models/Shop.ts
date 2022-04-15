import {DataTypes, Model, Sequelize} from "sequelize";
import moment = require("moment");

export class Shop extends Model {
	public shopPotionId!: number;

	public updatedAt!: Date;

	public createdAt!: Date;
}

export function initModel(sequelize: Sequelize): void {
	Shop.init({
		shopPotionId: {
			type: DataTypes.INTEGER,
			defaultValue: 5
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "shop",
		freezeTableName: true
	});

	Shop.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default Shop;