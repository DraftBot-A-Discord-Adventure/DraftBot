/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
  const Inventories = Sequelize.define('Inventories', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lastDailyAt: {
      type: DataTypes.DATE,
      defaultValue: JsonReader.models.inventories.lastDailyAt,
    },
    player_id: {
      type: DataTypes.INTEGER,
    },
    weapon_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.weapon_id,
    },
    armor_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.armor_id,
    },
    potion_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.potion_id,
    },
    object_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.object_id,
    },
    backup_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.backup_id,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
    },
  }, {
    tableName: 'inventories',
    freezeTableName: true,
  });

  /**
   * @param {("itemID")} itemID - The itemID
   * @param {("itemType")} itemType - The itemType to know what kind of object is updated
   */
  Inventories.prototype.giveObject = function(itemID, itemType) {
    if (ITEMTYPE.POTION == itemType) {
      this.potion_id = itemID;
    }
    if (ITEMTYPE.WEAPON == itemType) {
      this.weapon_id = itemID;
    }
    if (ITEMTYPE.ARMOR == itemType) {
      this.armor_id = itemID;
    }
    if (ITEMTYPE.OBJECT == itemType) {
      this.backup_id = itemID;
    }
  };

  Inventories.prototype.generateRandomItem = async function() {
    // generate a random item
    const rarity = generateRandomRarity();
    const itemType = generateRandomItemType();
    const query = `SELECT id
                   FROM :itemType
                   WHERE rarity = :rarity`;
    const itemsIds = await Sequelize.query(query, {
      replacements: {
        itemType: itemType,
        rarity: rarity,
      },
      type: Sequelize.QueryTypes.SELECT,
    });
    let item;
    if (ITEMTYPE.POTION == itemType) {
      item = await Potions.findOne({
        where: {
          id: itemsIds[
              draftbotRandom.integer(0, itemsIds.length - 1)
          ].id,
        },
      });
    }
    if (ITEMTYPE.WEAPON == itemType) {
      item = await Weapons.findOne({
        where: {
          id: itemsIds[
              draftbotRandom.integer(0, itemsIds.length - 1)
          ].id,
        },
      });
    }
    if (ITEMTYPE.ARMOR == itemType) {
      item = await Armors.findOne({
        where: {
          id: itemsIds[
              draftbotRandom.integer(0, itemsIds.length - 1)
          ].id,
        },
      });
    }
    if (ITEMTYPE.OBJECT == itemType) {
      item = await Objects.findOne({
        where: {
          id: itemsIds[
              draftbotRandom.integer(0, itemsIds.length - 1)
          ].id,
        },
      });
    }
    return item;
  };

  Inventories.beforeSave((instance) => {
    instance.setDataValue('updatedAt',
        require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  Inventories.prototype.updateLastDailyAt = function() {
    const moment = require('moment');
    this.lastDailyAt = new moment();
  };

  Inventories.prototype.drinkPotion = function() {
    this.potion_id = JsonReader.models.inventories.potion_id;
  };

  /**
   * @param {("fr"|"en")} language - The language the inventory has to be displayed in
   */
  Inventories.prototype.toEmbedObject = async function(language) {
    return [
      await (await this.getWeapon()).toFieldObject(language),
      await (await this.getArmor()).toFieldObject(language),
      await (await this.getPotion()).toFieldObject(language),
      await (await this.getActiveObject()).toFieldObject(language, 'active'),
      await (await this.getBackupObject()).toFieldObject(language, 'backup'),
    ];
  };

  /**
   *
   * @param {("fr"|"en")} language
   * @return {boolean}
   */
  Inventories.prototype.hasItemToSell = function() {
    return this.backup_id !== JsonReader.models.inventories.backup_id;
  };

  return Inventories;
};
