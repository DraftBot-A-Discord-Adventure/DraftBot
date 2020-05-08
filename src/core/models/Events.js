module.exports = (sequelize, DataTypes) => {

  const Events = sequelize.define('Events', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fr: {
      type: DataTypes.TEXT
    },
    en: {
      type: DataTypes.TEXT
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment').utc().format('YYYY-MM-DD HH:mm:ss')
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment').utc().format('YYYY-MM-DD HH:mm:ss')
    }
  }, {
    tableName: 'events',
    freezeTableName: true
  });

  return Events;
};
