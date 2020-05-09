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

  /**
   * @param {String} discordUser_id
   */
  Entities.getByDiscordUserId = (discordUser_id) => {
    return Entities.findOne({
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

  /**
   * @param {Number} id
   */
  Entities.getById = (id) => {
    return Entities.findOne({
      where: {
        id: id
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

  /**
   * @param {String[]} args=[]
   * @param {module:"discord.js".Message} message
   */
  Entities.getByArgs = async (args, message) => {
    if (isNaN(args[0])) {
      return Entities.getByDiscordUserId(message.mentions.users.last().id);
    } else {
      let [player] = await Players.getByRank(parseInt(args[0]));
      return Entities.getById(player.entity_id);
    }
  };

  return Entities;
};
