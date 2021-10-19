import {Constants} from "../Constants";

const moment = require("moment");

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const InventorySlots = Sequelize.define(
		"InventorySlots",
		{
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
		},
		{
			tableName: "inventory_slots",
			freezeTableName: true
		}
	);

	InventorySlots.prototype.getItem = async function() {
		switch (this.itemCategory) {
		case Constants.ITEM_CATEGORIES.WEAPON:
			return await Weapons.findOne({
				where: {
					id: this.itemId
				}
			});
		case Constants.ITEM_CATEGORIES.ARMOR:
			return await Armors.findOne({
				where: {
					id: this.itemId
				}
			});
		case Constants.ITEM_CATEGORIES.POTION:
			return await Potions.findOne({
				where: {
					id: this.itemId
				}
			});
		case Constants.ITEM_CATEGORIES.OBJECT:
			return await Objects.findOne({
				where: {
					id: this.itemId
				}
			});
		default: return Promise.resolve(null);
		}
	};

	InventorySlots.prototype.isEquipped = function() {
		return this.slot === 0;
	};

	InventorySlots.prototype.isWeapon = function() {
		return this.itemCategory === Constants.ITEM_CATEGORIES.WEAPON;
	};

	InventorySlots.prototype.isArmor = function() {
		return this.itemCategory === Constants.ITEM_CATEGORIES.ARMOR;
	};

	InventorySlots.prototype.isPotion = function() {
		return this.itemCategory === Constants.ITEM_CATEGORIES.POTION;
	};

	InventorySlots.prototype.isObject = function() {
		return this.itemCategory === Constants.ITEM_CATEGORIES.OBJECT;
	};

	return InventorySlots;
};
