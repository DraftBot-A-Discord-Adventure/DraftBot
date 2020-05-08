module.exports = (sequelize, DataTypes) => {

  const Objects = sequelize.define('Objects', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rarity: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.objects.rarity
    },
    power: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.objects.power
    },
    nature: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.objects.nature
    },
    fr: {
      type: DataTypes.TEXT
    },
    en: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'objects',
    freezeTableName: true
  });

  return Objects;
};
