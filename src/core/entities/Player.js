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

}

module.exports = Player;
