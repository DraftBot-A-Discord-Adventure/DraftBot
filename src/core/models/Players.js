/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
  const Players = Sequelize.define('players', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.score,
    },
    weeklyScore: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.weeklyScore,
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.level,
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.experience,
    },
    money: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.money,
    },
    badges: {
      type: DataTypes.TEXT,
      defaultValue: JsonReader.models.players.badges,
    },
    lastReportAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')(),
    },
    entity_id: {
      type: DataTypes.INTEGER,
    },
    guild_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.guild_id,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
    },
    topggVoteAt: {
      type: DataTypes.DATE,
      defaultValue: new Date(0)
    }
  }, {
    tableName: 'players',
    freezeTableName: true,
  });

  /**
   * Add a badge to the player badges
   * @param {String} badge - The badge to be added to player
   * @returns {boolean} if the badge has been applied
   */
  Players.prototype.addBadge = function(badge) {
    if (this.badges !== null) {
      if (!this.hasBadge(badge)) {
        this.badges += '-' + badge;
      }
      else {
        return false;
      }
    } else {
      this.badges = badge;
    }
    return true;
  };

  /**
   * @param {String} badge - The badge to be added to player
   */
  Players.prototype.hasBadge = function(badge) {
    return this.badges === null ? false : this.badges.split('-')
        .includes(badge);
  };

  Players.beforeSave((instance) => {
    instance.setDataValue('updatedAt',
        require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @param {Number} id
   */
  Players.getById = async (id) => {
    const query = `SELECT *
                   FROM (SELECT id,
                                RANK() OVER (ORDER BY score desc, level desc)       rank,
                                RANK() OVER (ORDER BY weeklyScore desc, level desc) weeklyRank
                         FROM players)
                   WHERE id = :id`;
    return await Sequelize.query(query, {
      replacements: {
        id: id,
      },
      type: Sequelize.QueryTypes.SELECT,
    });
  };

  /**
   * @param {Number} rank
   */
  Players.getByRank = async (rank) => {
    const query = `SELECT *
                   FROM (SELECT entity_id,
                                RANK() OVER (ORDER BY score desc, level desc)       rank,
                                RANK() OVER (ORDER BY weeklyScore desc, level desc) weeklyRank
                         FROM players)
                   WHERE rank = :rank`;
    return await Sequelize.query(query, {
      replacements: {
        rank: rank,
      },
      type: Sequelize.QueryTypes.SELECT,
    });
  };

  /**
   * @return {Number} Return the experience needed to level up.
   */
  Players.prototype.getExperienceNeededToLevelUp = function() {
    return JsonReader.models.players.xp[this.level + 1];
  };

  /**
   * @param {Number} score
   */
  Players.prototype.addScore = function(score) {
    this.score += score;
    this.setScore(this.score);
  };

  /**
   * @param {Number} score
   */
  Players.prototype.setScore = function(score) {
    if (score > 0) {
      this.score = score;
    } else {
      this.score = 0;
    }
  };

  /**
   * @param {Number} money
   */
  Players.prototype.addMoney = function(money) {
    this.money += money;
    this.setMoney(this.money);
  };

  /**
   * @param {Number} money
   */
  Players.prototype.setMoney = function(money) {
    if (money > 0) {
      this.money = money;
    } else {
      this.money = 0;
    }
  };

  /**
   * @param {Number} weeklyScore
   */
  Players.prototype.addWeeklyScore = function(weeklyScore) {
    this.weeklyScore += weeklyScore;
    this.setWeeklyScore(this.weeklyScore);
  };

  /**
   * @param {Number} weeklyScore
   */
  Players.prototype.setWeeklyScore = function(weeklyScore) {
    if (weeklyScore > 0) {
      this.weeklyScore = weeklyScore;
    } else {
      this.weeklyScore = 0;
    }
  };

  /**
   * @param {"fr"|"en"} language
   */
  Players.prototype.getPseudo = async function(language) {
    await this.setPseudo(language);
    return this.pseudo;
  };

  /**
   * @param {Number} hours
   */
  Players.prototype.fastForward = async function(hours) {
    const moment = require('moment');
    const lastReport = new moment(this.lastReportAt).subtract(hours, 'h');
    this.lastReportAt = lastReport;
  };

  /**
   * @param {"fr"|"en"} language
   */
  Players.prototype.setPseudo = async function(language) {
    const entity = await this.getEntity();
    if (entity.discordUser_id !== undefined &&
        client.users.cache.get(entity.discordUser_id) !== undefined) {
      this.pseudo = client.users.cache.get(entity.discordUser_id).username;
    } else {
      this.pseudo = JsonReader.models.players.getTranslation(language).pseudo;
    }
  };

  /**
   * @return {Boolean} True if the player has levelUp false otherwise
   */
  Players.prototype.needLevelUp = function() {
    return (this.experience >= this.getExperienceNeededToLevelUp());
  };

  /**
   * Checks if the player need to level up and levels up him.
   * @param {Entity} entity
   * @param {module:"discord.js".TextChannel} channel The channel in which the level up message will be sent
   * @param {"fr"|"en"} language
   */
  Players.prototype.levelUpIfNeeded = async function (entity, channel, language) {
    if (!this.needLevelUp()) {
      return;
    }

    let bonuses = [];
    const xpNeeded = this.getExperienceNeededToLevelUp();

    this.level++;
    if (this.level === FIGHT.REQUIRED_LEVEL) {
      bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.fightUnlocked);
    }
    if (this.level % 10 === 0) {
      entity.health = entity.maxHealth;
      bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.healthRestored);
    } else if (this.level % 5 === 0) {
      entity.maxHealth += 5;
      entity.health += 5;
      bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.moreMaxHealth);
    }

    if (this.level % 9 === 0) {
      entity.speed += 5;
      bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.moreSpeed);
    }
    else if (this.level % 6 === 0) {
      entity.attack += 5;
      bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.moreAttack);
    }
    else if (this.level % 3 === 0) {
      entity.defense += 5;
      bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.moreDefense);
    }

    bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.moreFightPower);

    this.experience -= xpNeeded;
    let msg = format(JsonReader.models.players.getTranslation(language).levelUp.mainMessage, {mention: entity.getMention(), level: this.level});
    for (let i = 0; i < bonuses.length - 1; ++i) {
      msg += bonuses[i] + "\n";
    }
    msg += bonuses[bonuses.length - 1];
    await channel.send(msg);
  };

  /**
   * Update the lastReport matching the last time the player has been see
   * @param {Number} time
   * @param {Number} timeMalus
   * @param {String} effectMalus
   */
  Players.prototype.setLastReportWithEffect = function(
      time, timeMalus, effectMalus) {
    if (timeMalus > 0 && effectMalus === ":clock2:") {
      this.lastReportAt = new Date(time + minutesToMilliseconds(timeMalus));
    }
    else {
      this.lastReportAt = new Date(time + JsonReader.models.players.effectMalus[effectMalus]);
    }
  };

  /**
   * Apply dead effect, send message in channel and in PM only if the health is 0 or less.
   * @param {Entity} entity
   * @param {module:"discord.js".TextChannel} channel The channel in which the level up message will be sent
   * @param {"fr"|"en"} language
   * @return {Promise<void>}
   */
  Players.prototype.killIfNeeded = async function(entity, channel, language) {

    if (entity.health > 0) {
      return;
    }

    entity.effect = EFFECT.DEAD;
    this.lastReportAt = new Date(9999, 1);
    await channel.send(format(JsonReader.models.players.getTranslation(language).ko, { pseudo: await this.getPseudo(language) }));
    channel.guild.members.fetch(entity.discordUser_id).then(user => user.send(JsonReader.models.players.getTranslation(language).koPM));
  };

  return Players;
};
