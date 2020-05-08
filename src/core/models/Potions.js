module.exports = (sequelize, DataTypes) => {

  const Potions = sequelize.define('Potions', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rarity: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.potions.rarity
    },
    power: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.potions.power
    },
    nature: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.potions.nature
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
    tableName: 'potions',
    freezeTableName: true
  });

  Potions.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  return Potions;
};
