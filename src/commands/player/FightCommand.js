const Fight = require('../../core/Fight');

/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const FightCommand = async function(language, message, args) {
  let attacker;
  [attacker] = await Entities.getOrRegister(message.author.id);

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], attacker)) !== true) {
    return;
  }

  /* let ftmp = new Fight(attacker, attacker, message, language); //Fight for testing
    return ftmp.startFight();*/

  let defender = null;
  if (args.length !== 0) {
    defender = await Entities.getByArgs(args, message);
    if (defender == null) {
      sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.defenderDoesntExist);
      return;
    } else if (defender.discordUser_id === attacker.discordUser_id) {
      sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.fightHimself);
      return;
    }
  }

  let canF;
  if ((canF = canFight(attacker)) !== FIGHT_ERROR.NONE) {
    sendError(message, attacker, canF, true, language);
    return;
  }
  if (defender != null && (canF = canFight(defender)) !== FIGHT_ERROR.NONE) {
    sendError(message, defender, canF, false, language);
    return;
  }

  let msg;
  let fightInstance = undefined;
  let spamCount = 0;
  global.addBlockedPlayer(attacker.discordUser_id, 'fight');
  if (defender == null) {
    msg = format(JsonReader.commands.fight.getTranslation(language).wantsToFightAnyone, {player: attacker.getMention()});
  } else {
    msg = format(JsonReader.commands.fight.getTranslation(language).wantsToFightSomeone, {
      player: attacker.getMention(),
      opponent: defender.getMention(),
    });
  }
  await message.channel.send(msg)
      .then(async function(messageFightAsk) {
        await messageFightAsk.react('✅');
        await messageFightAsk.react('❌');

        let filter;
        if (defender == null) {
          filter = (reaction, user) => {
            return !user.bot;
          };
        } else {
          filter = (reaction, user) => {
            return user.id === attacker.discordUser_id || user.id === defender.discordUser_id;
          };
        }

        const collector = messageFightAsk.createReactionCollector(filter, {time: 120000});

        collector.on('collect', async (reaction, user) => {
          switch (reaction.emoji.name) {
            case '✅':
              if (user.id === attacker.discordUser_id) {
                spamCount++;
                if (spamCount < 3) {
                  sendErrorMessage(user, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.fightHimself);
                  return;
                }
                sendErrorMessage(user, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.spamCanceled);
                fightInstance = null;
                break;
              }
              [defender] = await Entities.getOrRegister(user.id);
              if ((canF = canFight(defender)) !== FIGHT_ERROR.NONE) {
                sendError(message, defender, canF, true, language);
                defender = null;
                return;
              }
              let isTournament = tournamentChannel === message.channel.id;
              fightInstance = new Fight(attacker, defender, message, language, isTournament, isTournament ? tournamentPower : -1);
              fightInstance.startFight();
              break;
            case '❌':
              if (user.id === attacker.discordUser_id) {
                await message.channel.send(JsonReader.commands.fight.getTranslation(language).error.canceled);
              } else if (defender != null) {
                sendErrorMessage(user, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.opponentNotAvailable);
              } else {
                sendErrorMessage(user, message.channel, language, format(JsonReader.commands.fight.getTranslation(language).error.onlyInitiator, {pseudo: '<@' + user.id + '>'}));
                return;
              }
              fightInstance = null;
              break;
            default:
              return;
          }
          collector.stop();
        });

        collector.on('end', async function() {
          if (fightInstance === undefined) {
            global.removeBlockedPlayer(attacker.discordUser_id);
            if (defender == null) {
              sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.noOneAvailable);
            } else {
              sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.opponentNotAvailable);
            }
          }
          if (fightInstance == null) {
            global.removeBlockedPlayer(attacker.discordUser_id);
          }
        });
      });
};

/**
 * Send a message error
 * @param {module:"discord.js".Message} message
 * @param entity
 * @param {FIGHT_ERROR} error
 * @param {Boolean} direct If the error is caused by the entity itself
 * @param {"fr"|"en"} language
 */
function sendError(message, entity, error, direct, language) {
  switch (error) {
    case FIGHT_ERROR.WRONG_LEVEL:
      const msg = direct ?
                format(JsonReader.commands.fight.getTranslation(language).error.levelTooLow.direct, {pseudo: entity.getMention(), level: FIGHT.REQUIRED_LEVEL}) :
                format(JsonReader.commands.fight.getTranslation(language).error.levelTooLow.indirect, {level: FIGHT.REQUIRED_LEVEL});
      sendErrorMessage(message.guild.members.cache.get(entity.discordUser_id).user, message.channel, language, msg);
      break;
    case FIGHT_ERROR.DISALLOWED_EFFECT:
      const msg1 = direct ?
                format(JsonReader.commands.fight.getTranslation(language).error.cantFightStatus.direct, {pseudo: entity.getMention()}) :
                JsonReader.commands.fight.getTranslation(language).error.cantFightStatus.indirect;
      sendErrorMessage(message.guild.members.cache.get(entity.discordUser_id).user, message.channel, language, msg1);
      break;
    case FIGHT_ERROR.OCCUPIED:
      const msg2 = direct ?
                format(JsonReader.commands.fight.getTranslation(language).error.occupied.direct, {pseudo: entity.getMention()}) :
                JsonReader.commands.fight.getTranslation(language).error.occupied.indirect;
      sendErrorMessage(message.guild.members.cache.get(entity.discordUser_id).user, message.channel, language, msg2);
      break;
    default:
      break;
  }
}

/**
 * @param entity
 * @return {Number} error
 */
function canFight(entity) {
  if (entity == null) {
    return null;
  }
  if (entity.Player.level < FIGHT.REQUIRED_LEVEL) {
    return FIGHT_ERROR.WRONG_LEVEL;
  }
  if (!entity.currentEffectFinished()) {
    return FIGHT_ERROR.DISALLOWED_EFFECT;
  }
  if (global.hasBlockedPlayer(entity.discordUser_id)) {
    return FIGHT_ERROR.OCCUPIED;
  }
  return 0;
}

const FIGHT_ERROR = {
  NONE: 0,
  WRONG_LEVEL: 1,
  DISALLOWED_EFFECT: 2,
  OCCUPIED: 3,
};

module.exports = {
  'fight': FightCommand,
  'f': FightCommand,
};
