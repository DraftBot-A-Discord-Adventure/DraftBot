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
   * @param {Number} rank
   */
  Entities.getIdByRank = async (rank) => {
    const query = `SELECT entity_id FROM (SELECT entity_id, RANK() OVER (ORDER BY score desc) rank, RANK() OVER (ORDER BY weeklyScore desc) weeklyRank FROM players) WHERE rank = :rank`;
    let [entity] = await Entities.sequelize.query(query, {replacements: {rank: rank}, type: sequelize.QueryTypes.SELECT});
    return await Entities.getById(entity.entity_id);
  };

  /**
   * @param {String[]} args=[]
   * @param {module:"discord.js".Message} message
   */
  Entities.getByArgs = (args, message) => {
    if (isNaN(args[0])) {
      return Entities.getByDiscordUserId(message.mentions.users.last().id);
    } else {
      return Entities.getIdByRank(parseInt(args[0]));
    }
  };

  return Entities;
};
