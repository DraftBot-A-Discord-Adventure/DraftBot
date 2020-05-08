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
    tableName: 'objects',
    freezeTableName: true
  });

  Objects.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  return Objects;
};
