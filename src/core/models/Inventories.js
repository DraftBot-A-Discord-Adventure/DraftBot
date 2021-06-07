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
	const Inventories = Sequelize.define(
		"Inventories",
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			lastDailyAt: {
				type: DataTypes.DATE,
				defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
			},
			playerId: {
				type: DataTypes.INTEGER
			},
			weaponId: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.weaponId
			},
			armorId: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.armorId
			},
			potionId: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.potionId
			},
			objectId: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.objectId
			},
			backupId: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.inventories.backupId
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
			tableName: "inventories",
			freezeTableName: true
		}
	);

	/**
	 * @param {("itemID")} itemID - The itemID
	 * @param {("itemType")} itemType - The itemType to know what kind of object is updated
	 */
	Inventories.prototype.giveObject = function(itemID, itemType) {
		if (ITEMTYPE.POTION === itemType) {
			this.potionId = itemID;
		}
		if (ITEMTYPE.WEAPON === itemType) {
			this.weaponId = itemID;
		}
		if (ITEMTYPE.ARMOR === itemType) {
			this.armorId = itemID;
		}
		if (ITEMTYPE.OBJECT === itemType) {
			this.backupId = itemID;
		}
	};

	/**
	 * Generate a random item
	 * @param {number} rarityMax
	 * @param {number} itemType
	 * @returns {Item} generated item
	 */
	Inventories.prototype.generateRandomItem = async function(rarityMax = 8, itemType = null) {
		// generate a random item
		const rarity = generateRandomRarity(rarityMax);
		if (!itemType) {
			itemType = generateRandomItemType();
		}
		const query = `SELECT id
                   FROM :itemType
                   WHERE rarity = :rarity`;
		const itemsIds = await Sequelize.query(query, {
			replacements: {
				itemType: itemType,
				rarity: rarity
			},
			type: Sequelize.QueryTypes.SELECT
		});
		let item;
		if (ITEMTYPE.POTION === itemType) {
			item = await Potions.findOne({
				where: {
					id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id
				}
			});
		}
		if (ITEMTYPE.WEAPON === itemType) {
			item = await Weapons.findOne({
				where: {
					id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id
				}
			});
		}
		if (ITEMTYPE.ARMOR === itemType) {
			item = await Armors.findOne({
				where: {
					id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id
				}
			});
		}
		if (ITEMTYPE.OBJECT === itemType) {
			item = await Objects.findOne({
				where: {
					id: itemsIds[draftbotRandom.integer(0, itemsIds.length - 1)].id
				}
			});
		}
		return item;
	};

	/**
	 * Generate a random potion
	 * @param {number} rarityMax
	 * @param {number} potionType
	 * @returns {Potions} generated potion
	 */
	Inventories.prototype.generateRandomPotion = function(potionType = null, rarityMax = 8) {
		if (!potionType) {
			return this.generateRandomItem(rarityMax, ITEMTYPE.POTION);
		}
		// generate a random potion
		const rarity = generateRandomRarity(rarityMax);
		return Potions.findOne({
			where: {
				nature: potionType,
				rarity: rarity
			},
			order: Sequelize.random()
		});
	};

	/**
	 * Generate a random potion
	 * @param {number} rarityMax
	 * @param {number} objectType
	 * @returns {Potions} generated potion
	 */
	Inventories.prototype.generateRandomObject = function(objectType = null, rarityMax = 8) {
		if (!objectType) {
			return this.generateRandomItem(rarityMax, ITEMTYPE.POTION);
		}
		// generate a random potion
		const rarity = generateRandomRarity(rarityMax);
		return Objects.findOne({
			where: {
				nature: objectType,
				rarity: rarity
			},
			order: Sequelize.random()
		});
	};

	Inventories.beforeSave((instance) => {
		instance.setDataValue("updatedAt", moment().format("YYYY-MM-DD HH:mm:ss"));
	});

	Inventories.prototype.updateLastDailyAt = function() {
		this.lastDailyAt = new moment();
	};

	Inventories.prototype.drinkPotion = function() {
		this.potionId = JsonReader.models.inventories.potionId;
	};

	/**
	 * @param {("fr"|"en")} language - The language the inventory has to be displayed in
	 */
	Inventories.prototype.toEmbedObject = async function(language) {
		return [
			await (await this.getWeapon()).toFieldObject(language),
			await (await this.getArmor()).toFieldObject(language),
			await (await this.getPotion()).toFieldObject(language),
			await (await this.getActiveObject()).toFieldObject(language, "active"),
			await (await this.getBackupObject()).toFieldObject(language, "backup")
		];
	};

	/**
	 * check if inventory contains item to sell
	 * @return {boolean}
	 */
	Inventories.prototype.hasItemToSell = function() {
		return this.backupId !== JsonReader.models.inventories.backupId;
	};

	/**
	 * edit daily cooldown
	 * @param {number} hours
	 */
	Inventories.prototype.editDailyCooldown = function(hours) {
		this.lastDailyAt = new moment(this.lastDailyAt).add(hours, "h");
	};

	return Inventories;
};
