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
    }
  }, {
    tableName: 'events',
    freezeTableName: true
  });

  return Events;
};
