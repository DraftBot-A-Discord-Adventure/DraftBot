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
    }
  }, {
    tableName: 'potions',
    freezeTableName: true
  });

  return Potions;
};
