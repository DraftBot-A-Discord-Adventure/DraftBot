module.exports = (sequelize, DataTypes) => {

  const Players = sequelize.define('players', {
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
  }, {
    tableName: 'players',
    freezeTableName: true,
  });

  /**
  * @param {("badgeID")} badgeID - The badgeID
  * @returns {error} error - if the command is successfull or not
  */
  Players.prototype.giveBadge = function (badgeID) {
    if (badgeID == global.ARGUMENTS.RESET) {
      this.badges = "";
      return false;
    } else if (this.badges != "" && !this.badges.includes(badgeID)) {
      this.badges = this.badges + "-" + badgeID;
      return false;
    } else if (!this.badges.includes(badgeID)){
      this.badges = badgeID;
      return false;
    } else return true;
  };

  /**
  * @param {("points")} points - A number representating the score
  */
   * Add a badge to the player badges
   * @param {String} badge - The badge to be added to player
   */
  Players.prototype.addBadge = function (badge) {
    if (this.badges !== null) {
      if (!this.hasBadge(badge))
        this.badges += '-' + badge;
    } else {
      this.badges = badge;
    }
  };

  /**
   * @param {String} badge - The badge to be added to player
   */
  Players.prototype.hasBadge = function (badge) {
    return this.badges === null ? false : this.badges.split('-').includes(badge);
  }

  /**
   * @param {("points")} points - A number representating the score
   * @deprecated 2.1.0 Directly use score attribute from entity
   */
  Players.prototype.setPoints = function (points) {
    this.score = points;
  };

  /**
   * @param {("pointsWeek")} pointsWeek - A number representating the weekly score
   * @deprecated 2.1.0 Directly use weeklyScore attribute from entity
   */
  Players.prototype.setPointsWeek = function (points) {
    this.weeklyScore = points;
  };

  Players.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @param {Number} id
   */
  Players.getById = async (id) => {
    const query = `SELECT *
                   FROM (SELECT id,
                                RANK() OVER (ORDER BY score desc) rank,
                                RANK() OVER (ORDER BY weeklyScore desc) weeklyRank
                         FROM players)
                   WHERE id = :id`;
    return await sequelize.query(query, {
      replacements: {
        id: id
      },
      type: sequelize.QueryTypes.SELECT
    });
  };

  /**
   * @param {Number} rank
   */
  Players.getByRank = async (rank) => {
    const query = `SELECT *
                   FROM (SELECT entity_id,
                                RANK() OVER (ORDER BY score desc) rank,
                                RANK() OVER (ORDER BY weeklyScore desc) weeklyRank
                         FROM players)
                   WHERE rank = :rank`;
    return await sequelize.query(query, {
      replacements: {
        rank: rank
      },
      type: sequelize.QueryTypes.SELECT
    });
  };

  /**
   * @return {Number} Return the experience needed to level up.
   */
  Players.prototype.getExperienceNeededToLevelUp = function () {
    return JsonReader.models.players.xp[this.level + 1];
  };

  /**
   * @returns {Number} Return the experience used to level up.
   */
  Players.prototype.getExperienceUsedToLevelUp = function () {
    return JsonReader.models.players.xp[this.level];
  };

  /**
   * @param {Number} score
   */
  Players.prototype.addScore = function (score) {
    this.score += score;
    this.setScore(this.score);
  };

  /**
   * @param {Number} score
   */
  Players.prototype.setScore = function (score) {
    if (score > 0) {
      this.score = score;
    } else {
      this.score = 0;
    }
  };

  /**
   * @param {Number} money
   */
  Players.prototype.addMoney = function (money) {
    this.money += money;
    this.setMoney(this.money);
  };

  /**
   * @param {Number} money
   */
  Players.prototype.setMoney = function (money) {
    if (money > 0) {
      this.money = money;
    } else {
      this.money = 0;
    }
  };

  /**
   * @param {Number} weeklyScore
   */
  Players.prototype.addWeeklyScore = function (weeklyScore) {
    this.weeklyScore += weeklyScore;
    this.setWeeklyScore(this.weeklyScore);
  };

  /**
   * @param {Number} weeklyScore
   */
  Players.prototype.setWeeklyScore = function (weeklyScore) {
    if (weeklyScore > 0) {
      this.weeklyScore = weeklyScore;
    } else {
      this.weeklyScore = 0;
    }
  };

  /**
   * @param {"fr"|"en"} language
   */
  Players.prototype.getPseudo = async function (language) {
    await this.setPseudo(language);
    return this.pseudo;
  };

  /**
   * @param {Number} hours
   */
  Players.prototype.fastForward = async function (hours) {
    let moment = require('moment');
    let lastReport = new moment(this.lastReportAt).subtract(hours, 'h');
    this.lastReportAt = lastReport;
  };

  /**
   * @param {"fr"|"en"} language
   */
  Players.prototype.setPseudo = async function (language) {
    let entity = await this.getEntity();
    if (entity.discordUser_id !== undefined &&
      client.users.cache.get(entity.discordUser_id) !== null) {
      this.pseudo = client.users.cache.get(entity.discordUser_id).username;
    } else {
      this.pseudo = JsonReader.models.players.getTranslation(language).pseudo;
    }
  };


  /**
   * @return {Boolean} True if the player has levelUp false otherwise
   */
  Players.prototype.needLevelUp = function () {
    if ((this.experience >= this.getExperienceNeededToLevelUp())) {
      // TODO 2.0 Do the level up here ?
      return true;
    }
    return false;
  };

  // TODO 2.0 LevelUp
  // levelUp(message, language) {
  //   Text = require('../text/' + language);
  //   this.setLevel(this.getLevel() + 1);
  //   let messageLevelUp = Text.playerManager.levelUp.intro + message.author + Text.playerManager.levelUp.main + this.getLevel() + Text.playerManager.levelUp.end;
  //   let bonus = false;
  //   if (this.getLevel() == DefaultValues.fight.minimalLevel) {
  //     messageLevelUp += Text.playerManager.levelUp.fightUnlocked;
  //     bonus = true;
  //   }
  //   if (this.getLevel() % 10 == 0) {
  //     this.restoreHealthCompletely();
  //     messageLevelUp += Text.playerManager.levelUp.healthRestored;
  //     bonus = true;
  //   } else {
  //     if (this.getLevel() % 5 == 0) {
  //       this.setMaxHealth(this.getMaxHealth() + 5);
  //       this.addHealthPoints(5, message, language);
  //       messageLevelUp += Text.playerManager.levelUp.moreMaxHealth;
  //       bonus = true;
  //     }
  //   }
  //
  //   if (this.getLevel() % 9 == 0) {
  //     this.setSpeed(this.getSpeed() + 5);
  //     messageLevelUp = this.ifFirstBonus(bonus, messageLevelUp);
  //     messageLevelUp += Text.playerManager.levelUp.moreSpeed;
  //     bonus = true;
  //   } else {
  //     if (this.getLevel() % 6 == 0) {
  //       this.setAttack(this.getAttack() + 5);
  //       messageLevelUp = this.ifFirstBonus(bonus, messageLevelUp);
  //       messageLevelUp += Text.playerManager.levelUp.moreAttack;
  //       bonus = true;
  //     } else {
  //       if (this.getLevel() % 3 == 0) {
  //         this.setDefense(this.getDefense() + 5);
  //         messageLevelUp = this.ifFirstBonus(bonus, messageLevelUp);
  //         messageLevelUp += Text.playerManager.levelUp.moreDefense;
  //         bonus = true;
  //       }
  //     }
  //   }
  //   messageLevelUp = this.ifFirstBonus(bonus, messageLevelUp);
  //   messageLevelUp += Text.playerManager.levelUp.noBonus;
  //   message.channel.send(messageLevelUp);
  //   this.setExperience(this.getExperience() - this.getExperienceUsedToLevelUp(), message, language);
  // }
  //
  // /**
  //  *
  //  * @param {*} bonus
  //  * @param {*} messageLevelUp
  //  */
  // ifFirstBonus(bonus, messageLevelUp) {
  //   if (bonus == false) {
  //     messageLevelUp += Text.playerManager.levelUp.firstBonus;
  //   }
  //   return messageLevelUp;
  // }

  /**
   * Update the lastReport matching the last time the player has been see
   * @param {Number} time
   * @param {Number} timeMalus
   * @param {String} effectMalus
   */
  Players.prototype.setLastReportWithEffect = function (time, timeMalus, effectMalus) {
    this.lastReport = time + minutesToMilliseconds(timeMalus) + JsonReader.models.players.effectMalus[effectMalus];
  };

  return Players;
};