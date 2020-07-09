/**
 * @param entity
 * @param {Number} attack
 * @param {Number} defense
 * @param {Number} speed
 * @param {Number} power
 * @param {Number} maxDefenseImprovement
 * @param {Number} maxSpeedImprovement
 * @param {Number} chargeTurns
 * @param {FIGHT.ACTION} chargeAct
 */
class Fighter {
  /**
     * @param entity
     */
  constructor(entity) {
    this.entity = entity;
  }

  /**
     * Calculate all the stats of a fighter. Must be done outside of the constructor because of asynchronicity
     * @return {Promise<void>}
     */
  async calculateStats() {
    const inv = this.entity.Player.Inventory;
    const w = await inv.getWeapon();
    const a = await inv.getArmor();
    const p = await inv.getPotion();
    const o = await inv.getActiveObject();
    this.attack = this.entity.getCumulativeAttack(w, a, p, o);
    this.defense = this.entity.getCumulativeDefense(w, a, p, o);
    this.speed = this.entity.getCumulativeSpeed(w, a, p, o);
    this.power = this.entity.getCumulativeHealth(this.entity.Player);
    this.maxDefenseImprovement = FIGHT.MAX_DEFENSE_IMPROVEMENT;
    this.maxSpeedImprovement = FIGHT.MAX_SPEED_IMPROVEMENT;
    this.chargeTurns = -1;
    this.chargeAct = null;
  }

  /**
     * Drink the potion if it is a fight potion
     */
  async consumePotionIfNeeded() {
    if ((await this.entity.Player.Inventory.getPotion()).isFightPotion()) {
      this.entity.Player.Inventory.drinkPotion();
      this.entity.Player.Inventory.save();
      this.entity.Player.save();
    }
  }

  /**
     * Improve defense of the fighter and update max improvement
     * @return {number} Added defense
     */
  improveDefense() {
    this.maxDefenseImprovement += randInt(0, Math.round(this.maxDefenseImprovement / 2));
    this.defense += this.maxDefenseImprovement;
    const r = this.maxDefenseImprovement;
    this.maxDefenseImprovement = Math.floor(this.maxDefenseImprovement * 0.5);
    return r;
  }

  /**
     * Improve speed of the fighter and update max improvement
     * @return {number} Added speed
     */
  improveSpeed() {
    this.maxSpeedImprovement += randInt(0, Math.round(this.maxSpeedImprovement / 2));
    this.speed += this.maxSpeedImprovement;
    const r = this.maxSpeedImprovement;
    this.maxSpeedImprovement = Math.floor(this.maxSpeedImprovement * 0.5);
    return r;
  }

  /**
     * Make a player charge an action for a certain number of turns
     * @param {FIGHT.ACTION} action
     * @param {number} turns
     */
  chargeAction(action, turns) {
    this.chargeTurns = turns;
    this.chargeAct = action;
  }
}

/**
 * @param {Number} damage
 * @param {Number} defenseImprovement
 * @param {Number} speedImprovement
 * @param {Boolean} fullSuccess
 */
class FightActionResult {
  constructor() {
    this.damage = 0;
    this.defenseImprovement = 0;
    this.speedImprovement = 0;
    this.fullSuccess = false;
  }
}

/**
 * @param {Fighter[]} fighters
 * @param {Number} turn
 * @param {module:"discord.js".Message} message
 * @param {("fr"|"en")} language
 * @param {module:"discord.js".Message} lastSummary
 * @param {Number} elo
 * @param {Number} points
 */
class Fight {
  /**
     *
     * @param player1
     * @param player2
     * @param {module:"discord.js".Message} message
     * @param {("fr"|"en")} language - Language to use in the response
     * @returns {Promise<void>}
     */
  constructor(player1, player2, message, language) {
    if (randInt(0, 1) === 0) {
      this.fighters = [new Fighter(player1), new Fighter(player2)];
    } else {
      this.fighters = [new Fighter(player2), new Fighter(player1)];
    }
    this.turn = 0;
    this.message = message;
    this.language = language;
    this.lastSummary = undefined;
    this.actionMessages = undefined;
  }

  /** ******************************************************** EXTERNAL MECHANICS FUNCTIONS **********************************************************/

  /**
     * Starts the fight. Is not called automatically. Also calculates stats, consume potions, block players and proceed to next turn.
     * @return {Promise<void>}
     */
  async startFight() {
    if (this.hasStarted()) {
      throw new Error('The fight already started !');
    } else if (this.hasEnded()) {
      throw new Error('The fight cannot be started twice !');
    }
    for (let i = 0; i < this.fighters.length; i++) {
      await this.fighters[i].calculateStats();
      await this.fighters[i].consumePotionIfNeeded();
      global.addBlockedPlayer(this.fighters[i].entity.discordUser_id, 'fight');
    }
    this.introduceFight();
    this.actionMessages = [
      await this.message.channel.send('_ _'),
    ];
    await this.nextTurn();
  };

  /** ******************************************************** MESSAGE RELATED FUNCTIONS **********************************************************/

  /**
     * Send the fight intro message
     */
  introduceFight() {
    this.message.channel.send(format(JsonReader.commands.fight.getTranslation(this.language).intro, {
      player1: this.fighters[0].entity.getMention(),
      player2: this.fighters[1].entity.getMention(),
    }));
  }

  /**
     * Send the fight outro message
     */
  outroFight() {
    const loser = this.getLoser();
    if (loser != null) {
      this.message.channel.send(format(JsonReader.commands.fight.getTranslation(this.language).end.win, {
        winner: this.getWinner().entity.getMention(),
        loser: loser.entity.getMention(),
        elo: this.elo,
        points: this.points,
      }));
    } else {
      this.message.channel.send(format(JsonReader.commands.fight.getTranslation(this.language).end.draw, {
        player1: this.fighters[0].entity.getMention(),
        player2: this.fighters[1].entity.getMention(),
      }));
    }
  }

  /**
     * Send the turn indications in order to choose an action
     * @return {Promise<void>}
     */
  async sendTurnIndications() {
    const playingId = this.getPlayingFighter().entity.discordUser_id;
    const fight = this;

    const embed = new discord.MessageEmbed();
    /* embed.setThumbnail(await this.message.guild.members.cache.get(playingId).user.avatarURL())
            .setTitle(format(JsonReader.commands.fight.getTranslation(this.language).turnIndicationsTitle, {pseudo: await this.getPlayingFighter().entity.Player.getPseudo(this.language)}))
            .setDescription(JsonReader.commands.fight.getTranslation(this.language).turnIndicationsDescription);*/
    embed.setDescription(JsonReader.commands.fight.getTranslation(this.language).turnIndicationsDescription)
        .setAuthor(format(JsonReader.commands.fight.getTranslation(this.language).turnIndicationsTitle, {pseudo: await this.getPlayingFighter().entity.Player.getPseudo(this.language)}),
            await this.message.guild.members.cache.get(playingId).user.avatarURL());
    this.message.channel.send(embed)
        .then(async function(message) {
          const filter = (reaction, user) => {
            return user.id === playingId;
          };

          const collector = message.createReactionCollector(filter, {time: 30000});

          collector.on('collect', async (reaction) => {
            switch (reaction.emoji.name) {
              case '⚔':
                await message.delete().catch();
                await fight.useAction(FIGHT.ACTION.SIMPLE_ATTACK);
                break;
              case '🗡':
                await message.delete().catch();
                await fight.useAction(FIGHT.ACTION.QUICK_ATTACK);
                break;
              case '🪓':
                await message.delete().catch();
                await fight.useAction(FIGHT.ACTION.POWERFUL_ATTACK);
                break;
              case '🛡':
                await message.delete().catch();
                await fight.useAction(FIGHT.ACTION.IMPROVE_DEFENSE);
                break;
              case '🚀':
                await message.delete().catch();
                await fight.useAction(FIGHT.ACTION.IMPROVE_SPEED);
                break;
              case '💣':
                await message.delete().catch();
                await fight.useAction(FIGHT.ACTION.ULTIMATE_ATTACK);
                break;
              default:
                return;
            }
          });

          collector.on('end', () => {
            if (!message.deleted) {
              message.delete().catch();
              fight.getPlayingFighter().power = 0;
              fight.endFight();
            }
          });

          try {
            await message.react('⚔');
            await message.react('🗡');
            await message.react('🪓');
            await message.react('💣');
            await message.react('🛡');
            await message.react('🚀');
          } catch (e) {
          }
        });
  }

  /**
     * Get summarize embed message
     * @param {Fight} fight
     * @param {Fighter} attacker
     * @param {Fighter} defender
     * @return {Promise<{embed: {}}>}
     */
  async getSummarizeEmbed(fight, attacker, defender) {
    return {
      embed: {
        title: JsonReader.commands.fight.getTranslation(this.language).summarize.title,
        description:
                    JsonReader.commands.fight.getTranslation(this.language).summarize.intro +
                    format(JsonReader.commands.fight.getTranslation(this.language).summarize.attacker, {
                      pseudo: await attacker.entity.Player.getPseudo(this.language),
                      charging: attacker.chargeTurns > 0 ? JsonReader.commands.fight.getTranslation(this.language).actions.chargingEmote : '',
                    }) +
                    format(JsonReader.commands.fight.getTranslation(this.language).summarize.stats, {
                      power: attacker.power,
                      attack: attacker.attack,
                      defense: attacker.defense,
                      speed: attacker.speed,
                    }) +
                    format(JsonReader.commands.fight.getTranslation(this.language).summarize.defender, {
                      pseudo: await defender.entity.Player.getPseudo(this.language),
                      charging: defender.chargeTurns > 0 ? JsonReader.commands.fight.getTranslation(this.language).actions.chargingEmote : '',
                    }) +
                    format(JsonReader.commands.fight.getTranslation(this.language).summarize.stats, {
                      power: defender.power,
                      attack: defender.attack,
                      defense: defender.defense,
                      speed: defender.speed,
                    }),
      },
    };
  }

  /**
     * Summarize the fight
     * @return {Promise<void>}
     */
  async summarizeFight() {
    const attacker = this.getPlayingFighter();
    const defender = this.getDefendingFighter();

    if (this.lastSummary === undefined) {
      this.lastSummary = await this.message.channel.send(await this.getSummarizeEmbed(this, attacker, defender));
    } else {
      await this.lastSummary.edit(await this.getSummarizeEmbed(this, attacker, defender));
    }
  }

  /**
     * Send the result of the action
     * @param {FIGHT.ACTION} action
     * @param {FightActionResult} fightActionResult
     * @return {Promise<void>}
     */
  async sendActionMessage(action, fightActionResult) {
    let msg = JsonReader.commands.fight.getTranslation(this.language).actions.intro;
    const player = await this.getPlayingFighter().entity.Player.getPseudo(this.language);
    let section;
    switch (action) {
      case FIGHT.ACTION.IMPROVE_DEFENSE:
        await this.addActionMessage(format(msg + JsonReader.commands.fight.getTranslation(this.language).actions.defense, {
          emote: JsonReader.commands.fight.getTranslation(this.language).actions.defenseEmote,
          defense: fightActionResult.defenseImprovement,
          player: player,
        }));
        return;
      case FIGHT.ACTION.IMPROVE_SPEED:
        await this.addActionMessage(format(msg + JsonReader.commands.fight.getTranslation(this.language).actions.speed, {
          emote: JsonReader.commands.fight.getTranslation(this.language).actions.speedEmote,
          speed: fightActionResult.speedImprovement,
          player: player,
        }));
        return;
      case FIGHT.ACTION.POWERFUL_ATTACK:
        section = JsonReader.commands.fight.getTranslation(this.language).actions.attacks.powerful;
        break;
      case FIGHT.ACTION.QUICK_ATTACK:
        section = JsonReader.commands.fight.getTranslation(this.language).actions.attacks.quick;
        break;
      case FIGHT.ACTION.SIMPLE_ATTACK:
        section = JsonReader.commands.fight.getTranslation(this.language).actions.attacks.simple;
        break;
      case FIGHT.ACTION.ULTIMATE_ATTACK:
        section = JsonReader.commands.fight.getTranslation(this.language).actions.attacks.ultimate;
        break;
      default:
        return;
    }
    let resMsg;
    if (fightActionResult.damage === 0) {
      resMsg = 'failed';
    } else if (fightActionResult.fullSuccess) {
      resMsg = 'succeed';
    } else {
      resMsg = 'notGood';
    }
    const resultSection = JsonReader.commands.fight.getTranslation(this.language).actions.attacksResults[resMsg];
    msg += resultSection[randInt(0, resultSection.length - 1)];
    await this.addActionMessage(format(msg, {emote: section.emote, player: player, attack: section.name}) +
            section.end[resMsg] +
            format(JsonReader.commands.fight.getTranslation(this.language).actions.damages, {damages: fightActionResult.damage}));
  }

  /**
     * Add the action to an action message
     * @param {string} msg
     * @return {Promise<void>}
     */
  async addActionMessage(msg) {
    let amsg = this.actionMessages[this.actionMessages.length - 1];
    if (amsg.content.length + msg.length > 1950) {
      await this.lastSummary.delete();
      this.lastSummary = undefined;
      amsg = await this.message.channel.send(msg);
      this.actionMessages.push(amsg);
    } else if (amsg.content === '_ _') {
      await amsg.edit(msg);
    } else {
      await amsg.edit(amsg.content + '\n' + msg);
    }
  }

  /**
     * Scroll the messages down if needed
     * @return {Promise<void>}
     */
  async scrollIfNeeded() {
    const messages = await this.message.channel.messages.fetch({limit: 1});
    if (this.lastSummary !== undefined && messages.first().createdTimestamp !== this.lastSummary.createdTimestamp) {
      for (let i = 0; i < this.actionMessages.length; ++i) {
        const content = this.actionMessages[i].content;
        await this.actionMessages[i].delete();
        this.actionMessages[i] = await this.message.channel.send(content);
      }
      await this.lastSummary.delete();
      this.lastSummary = undefined;
      await this.summarizeFight();
    }
  }

  /** ******************************************************** INTERNAL MECHANICS FUNCTIONS **********************************************************/

  /**
     * Proceed to next turn or end the fight if there is a loser or the max turn is reached
     * @return {Promise<void>}
     */
  async nextTurn() {
    this.turn++;
    if (this.getLoser() != null || this.turn >= FIGHT.MAX_TURNS) {
      this.endFight();
      return;
    }
    const playing = this.getPlayingFighter();
    if (playing.chargeTurns > -1) {
      playing.chargeTurns--;
    }
    await this.scrollIfNeeded();
    if (playing.chargeTurns === 0) {
      await this.useAction(playing.chargeAct, true);
    } else if (playing.chargeTurns > 0) {
      await this.nextTurn();
    } else {
      await this.summarizeFight();
      await this.sendTurnIndications();
    }
  }

  /**
   * End the fight. Change fighters' score if there is a loser and unblock players
   */
  async endFight() {
    if (!this.hasStarted()) {
      throw new Error('The fight has not started yet !');
    } else if (this.hasEnded()) {
      throw new Error('The fight already ended !');
    }
    for (let i = 0; i < this.fighters.length; ++i) {
      [this.fighters[i].entity] = await Entities.getOrRegister(this.fighters[i].entity.discordUser_id);
    }
    const loser = this.getLoser();
    if (loser != null) {
      this.calculateElo();
      this.calculatePoints();
      loser.entity.Player.addScore(-this.points);
      loser.entity.Player.addWeeklyScore(-this.points);
      loser.entity.Player.save();
      const winner = this.getWinner();
      winner.entity.Player.addScore(this.points);
      winner.entity.Player.addWeeklyScore(this.points);
      winner.entity.Player.save();
    }
    for (let i = 0; i < this.fighters.length; i++) {
      global.removeBlockedPlayer(this.fighters[i].entity.discordUser_id);
    }
    if (this.lastSummary !== undefined) {
      this.lastSummary.delete({timeout: 5000}).catch();
    }
    this.outroFight();
    this.turn = -1;
  }

  /**
     * Makes the playing fighter use an action
     * @param {FIGHT.ACTION} action
     * @param {Boolean} charged If used after a charge
     * @return {Promise<void>}
     */
  async useAction(action, charged = false) {
    const success = Math.random();
    const attacker = this.getPlayingFighter();
    const defender = this.getDefendingFighter();
    const far = new FightActionResult();
    let powerChanger;

    switch (action) {
      case FIGHT.ACTION.QUICK_ATTACK:
        powerChanger = 0.1;
        if (defender.speed > attacker.speed && success < 0.1) {
          powerChanger = 0.6;
        } else if (defender.speed < attacker.speed && success < 0.95) {
          powerChanger = 0.65;
        }
        far.damage = Math.round(attacker.attack * powerChanger - Math.round(defender.defense * 0.1));
        far.fullSuccess = far.damage >= attacker.attack - defender.power;
        break;

      case FIGHT.ACTION.SIMPLE_ATTACK:
        powerChanger = 0.1;
        if ((defender.speed > attacker.speed && success <= 0.6) || (defender.speed < attacker.speed && success < 0.8)) {
          powerChanger = 1.0;
        } else if ((defender.speed > attacker.speed && success <= 0.9)) {
          powerChanger = 0.5;
        }
        far.damage = Math.round(attacker.attack * powerChanger - defender.defense);
        far.fullSuccess = far.damage >= 100;
        break;

      case FIGHT.ACTION.POWERFUL_ATTACK:
        powerChanger = 0.0;
        if ((defender.speed > attacker.speed && success <= 0.15) || (defender.speed < attacker.speed && success < 0.4)) {
          powerChanger = 1.4;
        } else if ((defender.speed > attacker.speed && success <= 0.5) || (defender.speed < attacker.speed && success < 0.7)) {
          powerChanger = 2.15;
        }
        if (powerChanger > 1) {
          attacker.speed = Math.round(attacker.speed * 0.75);
        } else {
          attacker.speed = Math.round(attacker.speed * 0.9);
        }
        far.damage = Math.round(attacker.attack * powerChanger - Math.round(defender.defense * 2.5));
        far.fullSuccess = powerChanger === 2;
        break;

      case FIGHT.ACTION.IMPROVE_DEFENSE:
        far.defenseImprovement = attacker.improveDefense();
        break;

      case FIGHT.ACTION.IMPROVE_SPEED:
        far.speedImprovement = attacker.improveSpeed();
        break;

      case FIGHT.ACTION.ULTIMATE_ATTACK:
        if (!charged) {
          await this.addActionMessage(format(JsonReader.commands.fight.getTranslation(this.language).actions.intro + JsonReader.commands.fight.getTranslation(this.language).actions.charging, {
            emote: JsonReader.commands.fight.getTranslation(this.language).actions.chargingEmote,
            player: await attacker.entity.Player.getPseudo(this.language),
          }));
          attacker.chargeAction(FIGHT.ACTION.ULTIMATE_ATTACK, 1);
          await this.nextTurn();
          return;
        }
        if ((defender.speed < attacker.speed && success <= 0.1) || (defender.speed > attacker.speed && success < 0.5)) {
          far.damage = Math.round(2.0 * defender.power / 3.0);
          far.fullSuccess = true;
        } else {
          far.damage = 0;
          far.fullSuccess = false;
        }
        break;

      default:
        return;
    }
    if (far.damage > 0) {
      defender.power -= far.damage;
      if (defender.power < 0) {
        defender.power = 0;
      }
    } else {
      far.damage = 0;
    }
    await this.sendActionMessage(action, far);
    await this.nextTurn();
  }


  /**
     * Calculate elo of the fight and set the attribute elo
     */
  calculateElo() {
    const loser = this.getLoser();
    const winner = this.getWinner();
    if (loser !== null && winner !== null && winner.entity.Player.score !== 0) {
      this.elo = Math.round((loser.entity.Player.score / winner.entity.Player.score) * 100) / 100;
    } else {
      this.elo = 0;
    }
  }

  /**
     * Calculate points of the fight based on elo and set the attribute points
     */
  calculatePoints() {
    const loser = this.getLoser();
    if (loser !== null) {
      this.points = Math.round(100 + 10 * loser.entity.Player.level * this.elo);
      if (this.points > 2000) {
        this.points = Math.round(2000 - randInt(5, 1000));
      }
    } else {
      this.points = 0;
    }
  }

  /** ******************************************************** GETTERS **********************************************************/

  /**
     * @return {boolean}
     */
  hasStarted() {
    return this.turn !== 0;
  }

  /**
     * @return {boolean}
     */
  hasEnded() {
    return this.turn === -1;
  }

  /**
     * @return {boolean} If the fight is currently running
     */
  isRunning() {
    return this.hasStarted() && !this.hasEnded();
  }

  /**
     * Get the playing fighter or null if the fight is not running
     * @return {Fighter|null}
     */
  getPlayingFighter() {
    return this.isRunning() ? this.fighters[(this.turn - 1) % 2] : null;
  }

  /**
     * Get the defending fighter or null if the fight is not running
     * @return {Fighter|null}
     */
  getDefendingFighter() {
    return this.isRunning() ? this.fighters[this.turn % 2] : null;
  }

  /**
     * Get the loser of the fight or null if there is none
     * @return {null|Fighter}
     */
  getLoser() {
    for (let i = 0; i < this.fighters.length; ++i) {
      if (this.fighters[i].power <= 0) {
        return this.fighters[i];
      }
    }
    return null;
  }

  /**
     * Get the winner of the fight or null if there is none
     * @return {null|Fighter}
     */
  getWinner() {
    const loser = this.getLoser();
    if (loser == null) {
      return null;
    }
    return loser === this.fighters[0] ? this.fighters[1] : this.fighters[0];
  }

  /**
     * @return {number}
     */
  getTurn() {
    return this.turn;
  }
}

module.exports = Fight;
