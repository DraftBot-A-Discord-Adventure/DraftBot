import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";

export class InventoryInfo extends Model {
	public updatedAt!: Date;

	public createdAt!: Date;
}

export class InventoryInfos {

}

export function initModel(sequelize: Sequelize) {
	InventoryInfo.init({
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
		tableName: "inventory_info",
		freezeTableName: true
	});

	InventoryInfo.beforeSave(instance => {
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default InventoryInfo;