module.exports = (sequelize, DataTypes) => {

  const Entities = sequelize.define('entities', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    maxHealth: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.maxHealth,
    },
    health: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.health,
    },
    attack: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.attack,
    },
    defense: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.defense,
    },
    speed: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.entities.speed,
    },
    effect: {
      type: DataTypes.STRING(32),
      defaultValue: JsonReader.models.entities.effect,
    },
    discordUser_id: {
      type: DataTypes.STRING(64),
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
    },
  }, {
    tableName: 'entities',
    freezeTableName: true,
  });

  Entities.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt',
        require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @param {String} discordUser_id
   */
  Entities.getOrRegister = (discordUser_id) => {
    return Entities.findOrCreate({
      where: {
        discordUser_id: discordUser_id,
      },
      defaults: { Player: { Inventory: {} } },
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
  Entities.getByGuild = (guildId) => {
    return Entities.findAll({
      defaults: { Player: { Inventory: {} } },
      include: [{
        model: Players,
        as: 'Player',
        where: {
          guild_id: guildId
        },
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
        discordUser_id: discordUser_id,
      },
      defaults: {Player: {Inventory: {}}},
      include: [
        {
          model: Players,
          as: 'Player',
          include: [
            {
              model: Inventories,
              as: 'Inventory',
            }],
        }],
    });
  };

  /**
   * @param {Number} id
   */
  Entities.getById = (id) => {
    return Entities.findOne({
      where: {
        id: id,
      },
      defaults: {Player: {Inventory: {}}},
      include: [
        {
          model: Players,
          as: 'Player',
          include: [
            {
              model: Inventories,
              as: 'Inventory',
            }],
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

  /**
   * Returns this player instance's current cumulative attack
   * @param {Weapons} weapon
   * @param {Armors} armor
   * @param {Potions} potion
   * @param {Objects} object
   * @return {Number}
   */
  Entities.prototype.getCumulativeAttack = function(
      weapon, armor, potion, object) {
    let attack = this.attack + weapon.getAttack() + armor.getAttack() +
        potion.getAttack() + object.getAttack();
    return (attack > 0) ? attack : 0;
  };

  /**
   * Returns this player instance's current cumulative defense
   * @param {Weapons} weapon
   * @param {Armors} armor
   * @param {Potions} potion
   * @param {Objects} object
   * @return {Number}
   */
  Entities.prototype.getCumulativeDefense = function(
      weapon, armor, potion, object) {
    let defense = this.defense + weapon.getDefense() + armor.getDefense() +
        potion.getDefense() + object.getDefense();
    return (defense > 0) ? defense : 0;
  };

  /**
   * Returns this player instance's current cumulative speed
   * @param {Weapons} weapon
   * @param {Armors} armor
   * @param {Potions} potion
   * @param {Objects} object
   * @return {Number}
   */
  Entities.prototype.getCumulativeSpeed = function(
      weapon, armor, potion, object) {
    let speed = this.speed + weapon.getSpeed() + armor.getSpeed() +
        potion.getSpeed() + object.getSpeed();
    return (speed > 0) ? speed : 0;
  };

  /**
   * Returns this player instance's current cumulative health
   * @param {Players} player
   * @return {Number}
   */
  Entities.prototype.getCumulativeHealth = function (player) {
    return this.health + (player.level * 10);
  };

  /**
   * @param {module:"discord.js".Message} message
   * @return {Boolean|String}
   */
  Entities.prototype.checkEffect = function () {
    if ([EFFECT.BABY, EFFECT.SMILEY, EFFECT.DEAD].indexOf(this.effect) !== -1) {
      return true;
    }
    return false;
  };

  /**
   * @param {Number} health
   */
  Entities.prototype.addHealth = function(health) {
    this.health += health;
    this.setHealth(this.health);
  };

  /**
   * @param {Number} health
   */
  Entities.prototype.setHealth = function(health) {
    if (health < 0) {
      // TODO: Kill the player (send death message and set skull status)
      this.health = 0;
    } else {
      if (health > this.maxHealth) {
        this.health = this.maxHealth;
      } else {
        this.health = health;
      }
    }
  };

  /**
   * TODO 2.0
   * @param message
   * @param language
   */
  Entities.prototype.kill = function(message, language) {
    // this.setEffect(":skull:");
    // this.setHealth(0);
    // message.channel.send(Text.entity.killPublicIntro + message.author.username + Text.entity.killPublicMessage)
    // message.author.send(Text.entity.killMessage)
  }
  
  /**
   * @returns {String}
   */
  Entities.prototype.getMention = function() {
    return "<@" + this.discordUser_id + ">";
  };

  return Entities;
};
