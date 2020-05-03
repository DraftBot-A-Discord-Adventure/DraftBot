const Entity = require('entities/Entity');

/**
 * @property {String} id
 * @property {Number} maxHealth
 * @property {Number} health
 * @property {Number} attack
 * @property {Number} defense
 * @property {Number} speed
 * @property {String} effect
 * @property {String} discordId
 * @property {Number} score
 * @property {Number} weeklyScore
 * @property {Number} level
 * @property {Number} experience
 * @property {Number} money
 * @property {Number} lastReport
 * @property {String} badges
 * @property {String} guildId
 * @property {Number} rank
 * @property {Number} weeklyRank
 * @property {String} pseudo
 */
class Player extends Entity {

  /**
   * @param {String} id
   * @param {Number} maxHealth
   * @param {Number} health
   * @param {Number} attack
   * @param {Number} defense
   * @param {Number} speed
   * @param {String} effect
   * @param {Number} score
   * @param {Number} weeklyScore
   * @param {Number} level
   * @param {Number} experience
   * @param {Number} money
   * @param {Number} lastReport
   * @param {String} badges
   * @param {String} guildId
   * @param {Number} rank
   * @param {Number} weeklyRank
   */
  constructor({
    id, maxHealth, health, attack, defense, speed, effect, score, weeklyScore,
    level, experience, money, lastReport, badges, guildId, rank, weeklyRank,
  }) {
    super({id, maxHealth, health, attack, defense, speed, effect});

    this.discordId = id;
    this.score = score;
    this.weeklyScore = weeklyScore;
    this.level = level;
    this.experience = experience;
    this.money = money;
    this.lastReport = lastReport;
    this.badges = badges;
    this.guildId = guildId;
    this.rank = rank;
    this.weeklyRank = weeklyRank;

    if (this.discordId !== undefined &&
        client.users.cache.get(this.discordId) !== null) {
      this.pseudo = client.users.cache.get(this.discordId).username;
    } else {
      this.pseudo = null;
    }
  }

  /**
   * Return an object of player for display purposes
   * @param {("fr"|"en")} language - The language the object has to be displayed in
   * @param {module:"discord.js".Message} message - Message from the discord server
   * @returns {Object}
   */
  async toEmbedObject(language, message) {
    let result = {
      title: format(
          JsonReader.entities.player.getTranslation(language).title, {
            effect: this.effect,
            pseudo: this.getPseudo(language),
            level: this.level,
          }),
      fields: [],
    };

    result.fields.push({
      name: JsonReader.entities.player.getTranslation(
          language).information.fieldName,
      value: format(JsonReader.entities.player.getTranslation(
          language).information.fieldValue, {
        health: this.health,
        maxHealth: this.maxHealth,
        experience: this.experience,
        experienceNeededToLevelUp: this.getExperienceNeededToLevelUp(),
        money: this.money,
      }),
    });

    let inventory = await getRepository('inventory')
        .getByPlayerIdOrCreate(this.discordId);
    let weapon = await getRepository('weapon').getById(inventory.weaponId);
    let armor = await getRepository('armor').getById(inventory.armorId);
    let potion = await getRepository('potion').getById(inventory.potionId);
    let object = await getRepository('object').getById(inventory.objectId);

    result.fields.push({
      name: JsonReader.entities.player.getTranslation(
          language).statistique.fieldName,
      value: format(JsonReader.entities.player.getTranslation(
          language).statistique.fieldValue, {
        cumulativeAttack: (await this.getCumulativeAttack(weapon, armor, potion,
            object)),
        cumulativeDefense: (await this.getCumulativeDefense(weapon, armor,
            potion, object)),
        cumulativeSpeed: (await this.getCumulativeSpeed(weapon, armor, potion,
            object)),
        cumulativeMaxHealth: (await this.getCumulativeHealth()),
      }),
    });

    result.fields.push({
      name: JsonReader.entities.player.getTranslation(
          language).classement.fieldName,
      value: format(JsonReader.entities.player.getTranslation(
          language).classement.fieldValue, {
        rank: this.rank,
        numberOfPlayer: (await getRepository('player').getNumberOfPlayers()),
        score: this.score,
      }),
    });

    let timeLeft = await this.checkEffect(language, message);
    if (timeLeft !== true) {
      result.fields.push({
        name: JsonReader.commands.profile.getTranslation(
            language).timeLeft.fieldName,
        value: format(JsonReader.commands.profile.getTranslation(
            language).timeLeft.fieldValue,
            {effect: this.effect, timeLeft: timeLeft}),
      });
    }

    return result;
  }

  // https://github.com/jshint/jshint/issues/3381
  ['set'](field, value) {
    if (['score', 'weeklyScore', 'level', 'experience', 'money'].indexOf(
        field) !== -1) {
      this['set' + field.charAt(0).toUpperCase() + field.slice(1)](value);
    } else {
      super.set(field, value);
    }
  }

  /**
   * @param {Number} value
   */
  setScore(value) {
    if (value > 0) {
      this.score = value;
    } else {
      this.score = 0;
    }
  }

  /**
   * @param {Number} value
   */
  setWeeklyScore(value) {
    if (value > 0) {
      this.weeklyScore = value;
    } else {
      this.weeklyScore = 0;
    }
  }

  /**
   * Increments the Player's level, and subtract the experience needed for the level up from the Player's experience.
   * @param {*} message - The message that caused the levelup. Used to send a level up message
   * @param {String} language
   */
  setLevelUp(message, language) {
    // TODO
  }

  /**
   * Set this Player instance's level.
   * @param {Number} value - The level this Player instance should be. Must be a positive Number.
   */
  setLevel(value) {
    if (value > 0) {
      this.level = value;
    }
  }

  /**
   * Return the amount of experience needed to level up.
   * @return {Number} Return the experience needed to level up.
   */
  getExperienceNeededToLevelUp() {
    return JsonReader.entities.player.xp[this.level + 1];
  }

  /**
   * Return the amount of experience used to level up.
   * @returns {Number} Return the experience used to level up.
   */
  getExperienceUsedToLevelUp() {
    return JsonReader.entities.player.xp[this.level];
  }

  /**
   * TODO - WIP need testing
   * Add the specified amount of experience to the player's experience total.
   * @param {Number} value - The amount of experience to add. Must be a positive Number.
   * @return {string|void}
   */
  addExperience(value) {
    let experienceResult;
    if (value > 0) {
      experienceResult = this.setExperience(this.get('experience') + value);
    }
    if (experienceResult !== undefined) {
      return experienceResult;
    }
  }

  /**
   * TODO - WIP need testing, maybe remove for stack load
   * Set this Player instance's current experience.
   * @param {Number} value - The amount of experience this instance should have. Must be a positive or null Number.
   * @return {string|void}
   */
  setExperience(value) {
    if (value >= 0) {
      this.experience = value;
    }
    if ((this.experience >= this.getExperienceNeededToLevelUp())) {
      return 'doLevelUp';
    }
  }

  /**
   * TODO : Pas de setMoney ce qui permet d'avoir de la monnaie négative (pour un systeme de prêt par exemple avec intérêts)
   * @param {Number} value -
   */
  changeMoney(value) {
    this.money = this.get('money') + value;
  }

  /**
   * Returns this player instance's current cumulative attack
   * @param {Weapon} weapon
   * @param {Armor} armor
   * @param {Potion} potion
   * @param {D_Object} object
   * @return {Number}
   */
  async getCumulativeAttack(weapon, armor, potion, object) {
    return this.attack + weapon.getAttack() + armor.getAttack() +
        potion.getAttack() + object.getAttack();
  }

  /**
   * Returns this player instance's current cumulative defense
   * @param {Weapon} weapon
   * @param {Armor} armor
   * @param {Potion} potion
   * @param {D_Object} object
   * @return {Number}
   */
  async getCumulativeDefense(weapon, armor, potion, object) {
    return this.defense + weapon.getDefense() + armor.getDefense() +
        potion.getDefense() + object.getDefense();
  }

  /**
   * Returns this player instance's current cumulative speed
   * @param {Weapon} weapon
   * @param {Armor} armor
   * @param {Potion} potion
   * @param {D_Object} object
   * @return {Number}
   */
  async getCumulativeSpeed(weapon, armor, potion, object) {
    return this.speed + weapon.getSpeed() + armor.getSpeed() +
        potion.getSpeed() + object.getSpeed();
  }

  /**
   * Returns this player instance's current cumulative health
   * @return {Number}
   */
  async getCumulativeHealth() {
    return this.maxHealth + (this.level * 10);
  }

  /**
   * Get the pseudo. Returns the default language's one if not found
   * @param {"fr"|"en"} language
   * @returns {Promise<string|null>}
   */
  getPseudo(language) {
    this.setPseudo(language);
    return this.pseudo;
  }

  /**
   * Only if pseudo is null
   * @param {String} language
   */
  setPseudo(language) {
    if (this.pseudo === null) {
      this.pseudo = JsonReader.entities.player.getTranslation(
          language).unknownPlayer;
    }
  }

  /**
   * @param {("fr"|"en")} language
   * @param {module:"discord.js".Message} message
   * @return {Promise<Boolean|String>}
   */
  async checkEffect(language, message) {
    if ([EFFECT.BABY, EFFECT.SMILEY].indexOf(this.effect) !== -1) {
      return true;
    }

    if (this.effect !== EFFECT.CLOCK10 && this.effect !== EFFECT.SKULL &&
        message.createdTimestamp >= this.lastReport) {
      return true;
    }

    return minutesToString(millisecondsToMinutes(
        this.lastReport - message.createdTimestamp));
  }

  // TODO 2.0 Legacy code
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
  //
  // /**
  //  * Add a badge to the player.
  //  * @param {String} - The badge
  //  */
  // addBadge(badge) {
  //   if (!this.badges.includes(badge)) {
  //     if (this.badges.length === 0) {
  //       this.badges += badge;
  //     } else {
  //       this.badges += `-` + badge;
  //     }
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }
  //
  // /**
  //  * Update the timecode matching the last time the player has been see
  //  * @param {Number} time - The timecode to set
  //  * @param {Number} malusTime - A malus that has to be added to the lasReportTime
  //  * @param {String} effectMalus - The current effect of the player in case it gave an other malus
  //  */
  // updateLastReport(time, malusTime, effectMalus) {
  //   let realMalus = DefaultValues.effectMalus[effectMalus];
  //   this.lastReport = parseInt(time) + parseInt(Tools.convertMinutesInMiliseconds(malusTime)) + parseInt(realMalus);
  // }

}

module.exports = Player;
