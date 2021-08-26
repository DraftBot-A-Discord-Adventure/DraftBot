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
	const InventoryInfo = Sequelize.define(
		"InventoryInfo",
		{
			playerId: {
				type: DataTypes.INTEGER,
				primaryKey: true
			},
			lastDailyAt: {
				type: DataTypes.DATE,
				defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
			},
			weaponSlots: {
				type: DataTypes.INTEGER
			},
			armorSlots: {
				type: DataTypes.INTEGER
			},
			potionSlots: {
				type: DataTypes.INTEGER
			},
			objectSlots: {
				type: DataTypes.INTEGER
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
			tableName: "inventory_info",
			freezeTableName: true
		}
	);

	InventoryInfo.prototype.slotLimitForCategory = function(category) {
		switch (category) {
		case Constants.ITEM_CATEGORIES.WEAPON:
			return this.weaponSlots;
		case Constants.ITEM_CATEGORIES.ARMOR:
			return this.armorSlots;
		case Constants.ITEM_CATEGORIES.POTION:
			return this.potionSlots;
		case Constants.ITEM_CATEGORIES.OBJECT:
			return this.objectSlots;
		default:
			return 0;
		}
	};

	InventoryInfo.prototype.updateLastDailyAt = function() {
		this.lastDailyAt = new moment(); // eslint-disable-line new-cap
	};

	/**
	 * edit daily cooldown
	 * @param {number} hours
	 */
	Inventories.prototype.editDailyCooldown = function(hours) {
		this.lastDailyAt = new moment(this.lastDailyAt).add(hours, "h"); // eslint-disable-line new-cap
	};

	return InventoryInfo;
};
