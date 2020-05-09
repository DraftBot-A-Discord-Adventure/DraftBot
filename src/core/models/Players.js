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
      defaultValue: JsonReader.models.players.lastReportAt
    },
    entity_id: {
      type: DataTypes.INTEGER
    },
    guild_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.guild_id
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
    tableName: 'players',
    freezeTableName: true
  });

  Players.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @param {Number} id
   */
  Players.getById = async (id) => {
    const query = `SELECT * FROM (SELECT id, RANK() OVER (ORDER BY score desc) rank, RANK() OVER (ORDER BY weeklyScore desc) weeklyRank FROM players) WHERE id = :id`;
    return await sequelize.query(query, {replacements: {id: id}, type: sequelize.QueryTypes.SELECT});
  };

  /**
   * @param {Number} rank
   */
  Players.getByRank = async (rank) => {
    const query = `SELECT * FROM (SELECT entity_id, RANK() OVER (ORDER BY score desc) rank, RANK() OVER (ORDER BY weeklyScore desc) weeklyRank FROM players) WHERE rank = :rank`;
    return await sequelize.query(query, {replacements: {rank: rank}, type: sequelize.QueryTypes.SELECT});
  };

  /**
   * @param {("fr"|"en")} language - The language the inventory has to be displayed in
   * @param {module:"discord.js".Message} message - Message from the discord server
   */
  Players.prototype.toEmbedObject = async function(language, message) {
    let entity = await this.getEntity();
    let result = {
      title: format(
          JsonReader.models.players.getTranslation(language).title, {
            effect: entity.effect,
            pseudo: (await this.getPseudo(language)),
            level: this.level,
          }),
      fields: [],
    };

    result.fields.push({
      name: JsonReader.models.players.getTranslation(language).information.fieldName,
      value: format(JsonReader.models.players.getTranslation(language).information.fieldValue, {
        health: entity.health,
        maxHealth: entity.maxHealth,
        experience: this.experience,
        experienceNeededToLevelUp: this.getExperienceNeededToLevelUp(),
        money: this.money,
      }),
    });

    let inventory = await this.getInventory();
    let weapon = await inventory.getWeapon();
    let armor = await inventory.getArmor();
    let potion = await inventory.getPotion();
    let object = await inventory.getActiveObject();

    result.fields.push({
      name: JsonReader.models.players.getTranslation(language).statistique.fieldName,
      value: format(JsonReader.models.players.getTranslation(language).statistique.fieldValue, {
        cumulativeAttack: this.getCumulativeAttack(entity.attack, weapon, armor, potion, object),
        cumulativeDefense: this.getCumulativeDefense(entity.defense, weapon, armor, potion, object),
        cumulativeSpeed: this.getCumulativeSpeed(entity.speed, weapon, armor, potion, object),
        cumulativeMaxHealth: this.getCumulativeHealth(entity.maxHealth)
      }),
    });

    result.fields.push({
      name: JsonReader.models.players.getTranslation(language).classement.fieldName,
      value: format(JsonReader.models.players.getTranslation(language).classement.fieldValue, {
        rank: (await Players.getRankById(this.id)).rank,
        numberOfPlayer: (await Players.count({where: {score: {[(require('sequelize/lib/operators')).gt]: 100}}})),
        score: this.score,
      }),
    });

    let timeLeft = this.checkEffect(entity.effect, message);
    if (typeof timeLeft === 'string') {
      result.fields.push({
        name: JsonReader.commands.profile.getTranslation(language).timeLeft.fieldName,
        value: format(JsonReader.commands.profile.getTranslation(language).timeLeft.fieldValue, {effect: entity.effect, timeLeft: timeLeft}),
      });
    }

    return result;
  };

  /**
   * @return {Number} Return the experience needed to level up.
   */
  Players.prototype.getExperienceNeededToLevelUp = function() {
    return JsonReader.models.players.xp[this.level + 1];
  };

  /**
   * @returns {Number} Return the experience used to level up.
   */
  Players.prototype.getExperienceUsedToLevelUp = function() {
    return JsonReader.models.players.xp[this.level];
  };

  /**
   * Returns this player instance's current cumulative attack
   * @param {Weapons} weapon
   * @param {Armors} armor
   * @param {Potions} potion
   * @param {Objects} object
   * @return {Number}
   */
  Players.prototype.getCumulativeAttack = function(base, weapon, armor, potion, object) {
    let attack = base + weapon.getAttack() + armor.getAttack() + potion.getAttack() + object.getAttack();
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
  Players.prototype.getCumulativeDefense = function(base, weapon, armor, potion, object) {
    let defense = base + weapon.getDefense() + armor.getDefense() + potion.getDefense() + object.getDefense();
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
  Players.prototype.getCumulativeSpeed = function(base, weapon, armor, potion, object) {
    let speed = base + weapon.getSpeed() + armor.getSpeed() + potion.getSpeed() + object.getSpeed();
    return (speed > 0) ? speed : 0;
  };

  /**
   * Returns this player instance's current cumulative health
   * @return {Number}
   */
  Players.prototype.getCumulativeHealth = function(base) {
    return base + (this.level * 10);
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
  Players.prototype.getPseudo = async function( language) {
    await this.setPseudo(language);
    return this.pseudo;
  };

  /**
   * @param {"fr"|"en"} language
   */
  Players.prototype.setPseudo = async function( language) {
    let entity = await this.getEntity();

    if (entity.discordUser_id !== undefined && client.users.cache.get(entity.discordUser_id) !== null) {
      this.pseudo = client.users.cache.get(entity.discordUser_id).username;
    } else {
      this.pseudo = JsonReader.models.players.getTranslation(language).pseudo;
    }
  };

  /**
   * @param {String} effect
   * @param {module:"discord.js".Message} message
   * @return {Boolean|String}
   */
  Players.prototype.checkEffect = function(effect, message) {
    if ([EFFECT.BABY, EFFECT.SMILEY].indexOf(effect) !== -1) {
      return true;
    }

    if (EFFECT.SKULL !== effect && EFFECT.CLOCK10 !== effect && message.createdAt.getTime() >= this.lastReportAt.getTime()) {
      return true;
    }

    if (EFFECT.SKULL === effect || EFFECT.CLOCK10 === effect) {
      return false;
    }

    return minutesToString(millisecondsToMinutes(this.lastReportAt.getTime() - message.createdAt.getTime()));
  };

  return Players;
};
