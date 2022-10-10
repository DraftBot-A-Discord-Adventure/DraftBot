import {DataTypes, Model, Sequelize} from "sequelize";
import {Constants} from "../../../Constants";
import Weapon, {Weapons} from "./Weapon";
import Armor, {Armors} from "./Armor";
import Potion, {Potions} from "./Potion";
import ObjectItem, {ObjectItems} from "./ObjectItem";
import {GenericItemModel} from "./GenericItemModel";
import moment = require("moment");
import {playerActiveObjects} from "./PlayerActiveObjects";

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
	public static async getOfPlayer(playerId: number): Promise<InventorySlot[]> {
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

	static async getMainWeaponSlot(playerId: number): Promise<InventorySlot> {
		return await InventorySlot.findOne({
			where: {
				playerId,
				slot: 0,
				itemCategory: Constants.ITEM_CATEGORIES.WEAPON
			}
		});
	}

	static async getMainArmorSlot(playerId: number): Promise<InventorySlot> {
		return await InventorySlot.findOne({
			where: {
				playerId,
				slot: 0,
				itemCategory: Constants.ITEM_CATEGORIES.ARMOR
			}
		});
	}

	static async getMainPotionSlot(playerId: number): Promise<InventorySlot> {
		return await InventorySlot.findOne({
			where: {
				playerId,
				slot: 0,
				itemCategory: Constants.ITEM_CATEGORIES.POTION
			}
		});
	}

	static async getMainObjectSlot(playerId: number): Promise<InventorySlot> {
		return await InventorySlot.findOne({
			where: {
				playerId,
				slot: 0,
				itemCategory: Constants.ITEM_CATEGORIES.OBJECT
			}
		});
	}

	/**
	 * Return the current active items a player hold
	 */
	static async getMainSlotsItems(playerId: number): Promise<playerActiveObjects> {
		return {
			weapon: <Weapon>(await (await InventorySlots.getMainWeaponSlot(playerId)).getItem()),
			armor: <Armor>(await (await InventorySlots.getMainArmorSlot(playerId)).getItem()),
			potion: <Potion>(await (await InventorySlots.getMainPotionSlot(playerId)).getItem()),
			object: <ObjectItem>(await (await InventorySlots.getMainObjectSlot(playerId)).getItem())
		};
	}

	/**
	 * get the list of all the active objects of the player
	 */
	static async getPlayerActiveObjects(playerId: number): Promise<playerActiveObjects> {
		return await this.getMainSlotsItems(playerId);
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