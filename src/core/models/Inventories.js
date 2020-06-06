module.exports = (sequelize, DataTypes) => {

  const Inventories = sequelize.define('Inventories', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    lastDailyAt: {
      type: DataTypes.DATE,
      defaultValue: JsonReader.models.inventories.lastDailyAt
    },
    player_id: {
      type: DataTypes.INTEGER
    },
    weapon_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.weapon_id
    },
    armor_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.armor_id
    },
    potion_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.potion_id
    },
    object_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.object_id
    },
    backup_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.inventories.backup_id
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
    }
  }, {
    tableName: 'inventories',
    freezeTableName: true
  });

  /**
   * @param {("objectId")} objectId - The objectId
   * @param {("objectType")} objectType - The objectType to know what kind of object is updated
   */
  Inventories.prototype.giveObject = function(objectId, objectType) {
    if("potion" == objectType){this.potion_id = objectId;}
    if("weapon" == objectType){this.weapon_id = objectId;}
    if("armor" == objectType){this.armor_id = objectId;}
    if("object" == objectType){this.backup_id = objectId;}
  };

  Inventories.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  Inventories.prototype.updateLastDailyAt = function () {
    let moment = require('moment');
    this.lastDailyAt = new moment();
  };

  Inventories.prototype.drinkPotion = function () {
    this.potion_id = JsonReader.models.inventories.potion_id;
  };


  /**
   * @param {("fr"|"en")} language - The language the inventory has to be displayed in
   */
  Inventories.prototype.toEmbedObject = async function (language) {
    return [
      await (await this.getWeapon()).toFieldObject(language),
      await (await this.getArmor()).toFieldObject(language),
      await (await this.getPotion()).toFieldObject(language),
      await (await this.getActiveObject()).toFieldObject(language, 'active'),
      await (await this.getBackupObject()).toFieldObject(language, 'backup')
    ];
  };

  return Inventories;
};
