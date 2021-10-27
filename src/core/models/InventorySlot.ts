import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";

export class InventorySlot extends Model {
	public updatedAt!: Date;

	public createdAt!: Date;
}

export class InventorySlots {

}

export function initModel(sequelize: Sequelize) {
	InventorySlot.init({
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
		tableName: "inventory_slots",
		freezeTableName: true
	});

	InventorySlot.beforeSave(instance => {
		instance.updatedAt = require("moment")().format("YYYY-MM-DD HH:mm:ss");
	});
}

export default InventorySlot;