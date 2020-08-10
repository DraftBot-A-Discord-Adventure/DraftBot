/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
  const Entities = Sequelize.define('entities', {
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
    fightPointsLost: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'entities',
    freezeTableName: true,
  });

  Entities.beforeSave((instance) => {
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
   * @param {String} discordUser_id
   */
  Entities.getByGuild = (guildId) => {
    return Entities.findAll({
      defaults: {Player: {Inventory: {}}},
      include: [
        {
          model: Players,
          as: 'Player',
          where: {
            guild_id: guildId,
          },
          include: [
            {
              model: Inventories,
              as: 'Inventory',
            }],
        }],
      order: [
        [{model: Players, as: 'Player'}, 'score', 'DESC'],
        [{model: Players, as: 'Player'}, 'level', 'DESC']
      ]
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
      const lastMention = message.mentions.users.last();
      if (lastMention === undefined) {
        return [null];
      }
      return Entities.getOrRegister(lastMention.id);
    } else {
      const [player] = await Players.getByRank(parseInt(args[0]));
      if (player === undefined) {
        return [null];
      }
      return [await Entities.getById(player.entity_id)];
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
    const attack = this.attack + weapon.getAttack() + armor.getAttack() +
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
    const defense = this.defense + weapon.getDefense() + armor.getDefense() +
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
    const speed = this.speed + weapon.getSpeed() + armor.getSpeed() +
        potion.getSpeed() + object.getSpeed();
    return (speed > 0) ? speed : 0;
  };

  /**
   * Returns this player instance's current cumulative health. Returns the regenerative health
   * @param {Players} player
   * @return {Number}
   */
  Entities.prototype.getCumulativeHealth = function() {
    let maxHealth = this.getMaxCumulativeHealth();
    let fp = maxHealth - this.fightPointsLost;
    if (fp < 0) fp = 0;
    else if (fp > maxHealth) fp = maxHealth;
    return fp;
  };

  /**
   * Returns this player instance's max cumulative health
   * @param {Players} player
   * @return {Number}
   */
  Entities.prototype.getMaxCumulativeHealth = function() {
    return this.maxHealth + (this.Player.level * 10);
  };

  /**
   * @return {Boolean}
   */
  Entities.prototype.checkEffect = function() {
    return [EFFECT.BABY, EFFECT.SMILEY, EFFECT.DEAD].indexOf(this.effect) !== -1;
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
   * @return {String}
   */
  Entities.prototype.getMention = function() {
    return '<@' + this.discordUser_id + '>';
  };

  /**
   * Returns if the effect of the player is finished or not
   * @return {boolean}
   */
  Entities.prototype.currentEffectFinished = function () {
    if (this.effect === EFFECT.DEAD || this.effect === EFFECT.BABY) {
      return false;
    }
    if (this.effect === EFFECT.SMILEY) {
      return true;
    }
    return this.Player.lastReportAt < new Date();
  };

  return Entities;
};
