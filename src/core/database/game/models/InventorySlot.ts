import {DataTypes, Model, Sequelize} from "sequelize";
import Weapon, {Weapons} from "./Weapon";
import Armor, {Armors} from "./Armor";
import Potion, {Potions} from "./Potion";
import ObjectItem, {ObjectItems} from "./ObjectItem";
import {GenericItemModel} from "./GenericItemModel";
import {PlayerActiveObjects} from "./PlayerActiveObjects";
import {ItemConstants} from "../../../constants/ItemConstants";
import {Tags} from "./Tag";
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
		case ItemConstants.CATEGORIES.WEAPON:
			return await Weapons.getById(this.itemId);
		case ItemConstants.CATEGORIES.ARMOR:
			return await Armors.getById(this.itemId);
		case ItemConstants.CATEGORIES.POTION:
			return await Potions.getById(this.itemId);
		case ItemConstants.CATEGORIES.OBJECT:
			return await ObjectItems.getById(this.itemId);
		default:
			return Promise.resolve(null);
		}
	}

	isEquipped(): boolean {
		return this.slot === 0;
	}

	isWeapon(): boolean {
		return this.itemCategory === ItemConstants.CATEGORIES.WEAPON;
	}

	isArmor(): boolean {
		return this.itemCategory === ItemConstants.CATEGORIES.ARMOR;
	}

	isPotion(): boolean {
		return this.itemCategory === ItemConstants.CATEGORIES.POTION;
	}

	isObject(): boolean {
		return this.itemCategory === ItemConstants.CATEGORIES.OBJECT;
	}

	/**
	 * Get the category's name of the item
	 */
	getItemCategory(): string {
		switch (this.itemCategory) {
		case ItemConstants.CATEGORIES.WEAPON:
			return "Weapon";
		case ItemConstants.CATEGORIES.ARMOR:
			return "Armor";
		case ItemConstants.CATEGORIES.POTION:
			return "Potion";
		case ItemConstants.CATEGORIES.OBJECT:
			return "Object";
		default:
			return "Unknown";
		}
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

	/**
	 * Return the main weapon slot of the player or null if the inventory of the player has not been initialized
	 * @param playerId
	 */
	static async getMainWeaponSlot(playerId: number): Promise<InventorySlot> | null {
		return await InventorySlot.findOne({
			where: {
				playerId,
				slot: 0,
				itemCategory: ItemConstants.CATEGORIES.WEAPON
			}
		});
	}

	/**
	 * Return the main armor slot of the player or null if the inventory of the player has not been initialized
	 * @param playerId
	 */
	static async getMainArmorSlot(playerId: number): Promise<InventorySlot> | null {
		return await InventorySlot.findOne({
			where: {
				playerId,
				slot: 0,
				itemCategory: ItemConstants.CATEGORIES.ARMOR
			}
		});
	}

	/**
	 * Return the main potion slot of the player or null if the inventory of the player has not been initialized
	 * @param playerId
	 */
	static async getMainPotionSlot(playerId: number): Promise<InventorySlot> | null {
		return await InventorySlot.findOne({
			where: {
				playerId,
				slot: 0,
				itemCategory: ItemConstants.CATEGORIES.POTION
			}
		});
	}

	/**
	 * Return the main object slot of the player or null if the inventory of the player has not been initialized
	 * @param playerId
	 */
	static async getMainObjectSlot(playerId: number): Promise<InventorySlot> | null {
		return await InventorySlot.findOne({
			where: {
				playerId,
				slot: 0,
				itemCategory: ItemConstants.CATEGORIES.OBJECT
			}
		});
	}

	/**
	 * Return the current active items a player hold
	 */
	static async getMainSlotsItems(playerId: number): Promise<PlayerActiveObjects> {
		await this.getOfPlayer(playerId);
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
	static async getPlayerActiveObjects(playerId: number): Promise<PlayerActiveObjects> {
		return await this.getMainSlotsItems(playerId);
	}

	/**
	 * Checks if a player have a given item in its inventory
	 * @param playerId
	 * @param itemId
	 * @param category
	 */
	static async hasItem(playerId: number, itemId: number, category: number): Promise<boolean> {
		return await InventorySlot.findOne({
			rejectOnEmpty: false,
			where: {
				playerId,
				itemId,
				itemCategory: category
			}
		}) !== null;
	}

	/**
	 * Count the number of objects of a player that has the given tag
	 * @param playerId
	 * @param tag
	 */
	static async countObjectsOfPlayer(playerId: number, tag: string): Promise<number> {
		const objs = await InventorySlot.findAll({
			where: {
				playerId
			}
		});
		let count = 0;
		for (const obj of objs) {
			if ((await Tags.findTagsFromObject(obj.itemId, obj.getItemCategory())).find((t) => t.textTag === tag)) {
				count++;
			}
		}
		return count;
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