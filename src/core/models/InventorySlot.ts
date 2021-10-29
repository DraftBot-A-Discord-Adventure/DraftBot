import {
	Sequelize,
	Model,
	DataTypes
} from "sequelize";
import moment = require("moment");
import {Constants} from "../Constants";
import {Weapons} from "./Weapon";
import {Armors} from "./Armor";
import {Potions} from "./Potion";
import {ObjectItems} from "./ObjectItem";

export class InventorySlot extends Model {
	public playerId!: number;

	public slot!: number;

	public itemCategory!: number;

	public itemId!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	async getItem() {
		switch (this.itemCategory) {
		case Constants.ITEM_CATEGORIES.WEAPON:
			return await Weapons.getById(this.itemId);
		case Constants.ITEM_CATEGORIES.ARMOR:
			return await Armors.getById(this.itemId);
		case Constants.ITEM_CATEGORIES.POTION:
			return await Potions.getById(this.itemId);
		case Constants.ITEM_CATEGORIES.OBJECT:
			return await ObjectItems.getById(this.itemId);
		default: return Promise.resolve(null);
		}
	}

	isEquipped() {
		return this.slot === 0;
	}

	isWeapon() {
		return this.itemCategory === Constants.ITEM_CATEGORIES.WEAPON;
	}

	isArmor() {
		return this.itemCategory === Constants.ITEM_CATEGORIES.ARMOR;
	}

	isPotion() {
		return this.itemCategory === Constants.ITEM_CATEGORIES.POTION;
	}

	isObject() {
		return this.itemCategory === Constants.ITEM_CATEGORIES.OBJECT;
	}
}

export function initModel(sequelize: Sequelize) {
	InventorySlot.init({
		playerId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		slot: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		itemCategory: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		itemId: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		sequelize,
		tableName: "inventory_slots",
		freezeTableName: true
	});

	InventorySlot.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default InventorySlot;