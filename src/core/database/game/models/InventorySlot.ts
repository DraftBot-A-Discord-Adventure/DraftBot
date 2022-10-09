import {DataTypes, Model, Sequelize} from "sequelize";
import {Constants} from "../../../Constants";
import {Weapons} from "./Weapon";
import {Armors} from "./Armor";
import {Potions} from "./Potion";
import {ObjectItems} from "./ObjectItem";
import {GenericItemModel} from "./GenericItemModel";
import moment = require("moment");

export class InventorySlot extends Model {
	public readonly playerId!: number;

	public slot!: number;

	public itemCategory!: number;

	public itemId!: number;

	public updatedAt!: Date;

	public createdAt!: Date;


	async getItem(): Promise<GenericItemModel> {
		switch (this.itemCategory) {
		case Constants.ITEM_CATEGORIES.WEAPON:
			return await Weapons.getById(this.itemId);
		case Constants.ITEM_CATEGORIES.ARMOR:
			return await Armors.getById(this.itemId);
		case Constants.ITEM_CATEGORIES.POTION:
			return await Potions.getById(this.itemId);
		case Constants.ITEM_CATEGORIES.OBJECT:
			return await ObjectItems.getById(this.itemId);
		default:
			return Promise.resolve(null);
		}
	}

	isEquipped(): boolean {
		return this.slot === 0;
	}

	isWeapon(): boolean {
		return this.itemCategory === Constants.ITEM_CATEGORIES.WEAPON;
	}

	isArmor(): boolean {
		return this.itemCategory === Constants.ITEM_CATEGORIES.ARMOR;
	}

	isPotion(): boolean {
		return this.itemCategory === Constants.ITEM_CATEGORIES.POTION;
	}

	isObject(): boolean {
		return this.itemCategory === Constants.ITEM_CATEGORIES.OBJECT;
	}
}

export class InventorySlots {
	public static async getInventorySlotsOfPlayer(playerId: number): Promise<InventorySlot[]> {
		const slots: InventorySlot[] = await InventorySlot.findAll({
			where: {
				playerId
			}
		});
		if (slots.length === 0) {
			return await InventorySlot.bulkCreate(
				[
					{
						playerId,
						itemId: 0,
						slot: 0,
						itemCategory: 0
					},
					{
						playerId,
						itemId: 0,
						slot: 0,
						itemCategory: 1
					},
					{
						playerId,
						itemId: 0,
						slot: 0,
						itemCategory: 2
					},
					{
						playerId,
						itemId: 0,
						slot: 0,
						itemCategory: 3
					}
				]
			);
		}
		return slots;
	}
}

export function initModel(sequelize: Sequelize): void {
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