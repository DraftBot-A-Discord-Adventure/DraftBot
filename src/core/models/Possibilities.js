module.exports = (sequelize, DataTypes) => {

  const Possibilities = sequelize.define('Possibilities', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    possibilityKey: {
      type: DataTypes.STRING(32),
    },
    lostTime: {
      type: DataTypes.INTEGER,
    },
    health: {
      type: DataTypes.INTEGER,
    },
    effect: {
      type: DataTypes.STRING(32),
    },
    experience: {
      type: DataTypes.INTEGER,
    },
    money: {
      type: DataTypes.INTEGER,
    },
    item: {
      type: DataTypes.BOOLEAN,
    },
    fr: {
      type: DataTypes.TEXT
    },
    en: {
      type: DataTypes.TEXT
    },
    event_id: {
      type: DataTypes.INTEGER,
    },
  }, {
    tableName: 'possibilities',
    freezeTableName: true
  });

  return Possibilities;
};
