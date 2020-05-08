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

  Inventories.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @param {("fr"|"en")} language - The language the inventory has to be displayed in
   */
  Inventories.prototype.toEmbedObject = function(language) {
    let result = {
      // title: format(
      //     JsonReader.models.inventories.getTranslation(language).title, {
      //       pseudo: (await getRepository('player')
      //           .getByIdOrCreate(this.playerId)).getPseudo(language),
      //     }),
      fields: [],
    };

    // result.fields.push(
    //     (await getRepository('weapon').getById(this.weaponId)).toFieldObject(
    //         language));
    //
    // result.fields.push(
    //     (await getRepository('armor').getById(this.armorId)).toFieldObject(
    //         language));
    //
    // result.fields.push(
    //     (await getRepository('potion').getById(this.potionId)).toFieldObject(
    //         language));
    //
    // result.fields.push(
    //     (await getRepository('object').getById(this.objectId)).toFieldObject(
    //         language, 'active'));
    //
    // result.fields.push(
    //     (await getRepository('object').getById(this.backupItemId)).toFieldObject(
    //         language, 'backup'));

    return result;
  };

  return Inventories;
};
