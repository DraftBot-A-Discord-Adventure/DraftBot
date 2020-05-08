module.exports = (sequelize, DataTypes) => {

  const Weapons = sequelize.define('Weapons', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rarity: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.rarity
    },
    rawAttack: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.rawAttack
    },
    rawDefense: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.rawDefense
    },
    rawSpeed: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.rawSpeed
    },
    attack: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.attack
    },
    defense: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.defense
    },
    speed: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.speed
    },
    fr: {
      type: DataTypes.TEXT
    },
    en: {
      type: DataTypes.TEXT
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
    tableName: 'weapons',
    freezeTableName: true
  });

  Weapons.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  return Weapons;
};
