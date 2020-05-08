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
    }
  }, {
    tableName: 'inventories',
    freezeTableName: true
  });

  return Inventories;
};
