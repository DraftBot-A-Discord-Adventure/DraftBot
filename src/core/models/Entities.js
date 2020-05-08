module.exports = (sequelize, DataTypes) => {

  const Entities = sequelize.define('entities', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    maxHealth: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.maxHealth
    },
    health: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.health
    },
    attack: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.attack
    },
    defense: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.defense
    },
    speed: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.speed
    },
    effect: {
      type: DataTypes.STRING(32),
      defaultValue: JsonReader.models.entities.effect
    },
    discordUser_id: {
      type: DataTypes.STRING(64)
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
    tableName: 'entities',
    freezeTableName: true
  });

  Entities.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @param {String} discordUser_id
   */
  Entities.getOrRegister = (discordUser_id) => {
    return Entities.findOrCreate({
      where: {
        discordUser_id: discordUser_id
      },
      defaults: {Player: {Inventory: {}}},
      include: [{
        model: Players,
        as: 'Player',
        include: [{
          model: Inventories,
          as: 'Inventory'
        }]
      }],
    });
  };

  return Entities;
};
