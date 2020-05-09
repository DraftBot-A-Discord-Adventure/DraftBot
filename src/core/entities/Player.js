  /**
   * Return an object of player for display purposes
   * @param {("fr"|"en")} language - The language the object has to be displayed in
   * @param {module:"discord.js".Message} message - Message from the discord server
   * @returns {Object}
   */
  async toEmbedObject(language, message) {
    let result = {
      title: format(
          JsonReader.models.players.getTranslation(language).title, {
            effect: this.effect,
            pseudo: this.getPseudo(language),
            level: this.level,
          }),
      fields: [],
    };

    result.fields.push({
      name: JsonReader.models.players.getTranslation(
          language).information.fieldName,
      value: format(JsonReader.models.players.getTranslation(
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
      name: JsonReader.models.players.getTranslation(
          language).statistique.fieldName,
      value: format(JsonReader.models.players.getTranslation(
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
      name: JsonReader.models.players.getTranslation(
          language).classement.fieldName,
      value: format(JsonReader.models.players.getTranslation(
          language).classement.fieldValue, {
        rank: this.rank,
        numberOfPlayer: (await getRepository('player').getNumberOfPlayers()),
        score: this.score,
      }),
    });

    let timeLeft = await this.checkEffect(message);
    if (typeof timeLeft === 'string') {
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

  /**
   * @param {Number} value
   */
  addMoney(value) {
    this.money += value;
    this.setMoney(this.money);
  }

  /**
   * @param {Number} value
   */
  setMoney(value) {
    if (value > 0) {
      this.money = value;
    } else {
      this.money = 0;
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
   * Return the amount of experience needed to level up.
   * @return {Number} Return the experience needed to level up.
   */
  getExperienceNeededToLevelUp() {
    return JsonReader.models.players.xp[this.level + 1];
  }

  /**
   * Return the amount of experience used to level up.
   * @returns {Number} Return the experience used to level up.
   */
  getExperienceUsedToLevelUp() {
    return JsonReader.models.players.xp[this.level];
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
   * Returns this player instance's current cumulative attack
   * @param {Weapon} weapon
   * @param {Armor} armor
   * @param {Potion} potion
   * @param {D_Object} object
   * @return {Number}
   */
  async getCumulativeAttack(weapon, armor, potion, object) {
    let attack = this.attack + weapon.getAttack() + armor.getAttack() +
        potion.getAttack() + object.getAttack();
    return (attack > 0) ? attack : 0;
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
    let defense = this.defense + weapon.getDefense() + armor.getDefense() +
        potion.getDefense() + object.getDefense();
    return (defense > 0) ? defense : 0;
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
    let speed = this.speed + weapon.getSpeed() + armor.getSpeed() +
        potion.getSpeed() + object.getSpeed();
    return (speed > 0) ? speed : 0;
  }

  /**
   * Returns this player instance's current cumulative health
   * @return {Number}
   */
  async getCumulativeHealth() {
    return this.maxHealth + (this.level * 10);
  }

  /**
   * @param {module:"discord.js".Message} message
   * @return {Promise<Boolean|String>}
   */
  async checkEffect(message) {
    if ([EFFECT.BABY, EFFECT.SMILEY].indexOf(this.effect) !== -1) {
      return true;
    }

    if (EFFECT.SKULL !== this.effect && EFFECT.CLOCK10 !== this.effect && message.createdTimestamp >= this.lastReport) {
      return true;
    }

    if (EFFECT.SKULL === this.effect || EFFECT.CLOCK10 === this.effect) {
      return false;
    }

    return minutesToString(millisecondsToMinutes(
        this.lastReport - message.createdTimestamp));
  }

  /**
   * Update the lastReport matching the last time the player has been see
   * @param {Number} time
   * @param {Number} timeMalus
   * @param {String} effectMalus
   */
  setLastReportWithEffect(time, timeMalus, effectMalus) {
    this.lastReport = time + minutesToMilliseconds(timeMalus) + JsonReader.models.players.effectMalus[effectMalus];
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

}

module.exports = Player;
