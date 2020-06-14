let Fight = require("../../core/Fight");

/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const FightCommand = async function (language, message, args) {

    let attacker;
    [attacker] = await Entities.getOrRegister(message.author.id);
    let defender = null;
    if (args.length !== 0) {
        defender = await Entities.getByArgs(args, message);
        if (defender == null) {
            await message.channel.send(JsonReader.commands.fight.getTranslation(language).error.defenderDoesntExist);
            return;
        }
        else if (defender.discordUser_id === attacker.discordUser_id) {
            await message.channel.send(JsonReader.commands.fight.getTranslation(language).error.fightHimself);
            return;
        }
    }

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY], attacker)) !== true) {
        return;
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
    if (defender == null) {
        msg = format(JsonReader.commands.fight.getTranslation(language).wantsToFightAnyone, {player: attacker.getMention()});
    } else {
        msg = format(JsonReader.commands.fight.getTranslation(language).wantsToFightSomeone, {
            player: attacker.getMention(),
            opponent: defender.getMention()
        });
    }
    await message.channel.send(msg)
        .then(async function (message) {
            await message.react("✅");
            await message.react("❌");

            let filter;
            if (defender == null) {
                filter = (reaction, user) => {
                    return user.id === attacker.discordUser_id;
                };
            } else {
                filter = (reaction, user) => {
                    return user.id === attacker.discordUser_id || user.id === defender.discordUser_id;
                };
            }

            const collector = message.createReactionCollector(filter, {time: 60000});

            collector.on('collect', (reaction, user) => {
                switch (reaction.emoji.name) {
                    case "✅":
                        if (user.id === attacker.discordUser_id) {
                            spamCount++;
                            if (spamCount < 3) {
                                message.channel.send(JsonReader.commands.fight.getTranslation(language).error.fightHimself);
                                return;
                            }
                            message.channel.send(JsonReader.commands.fight.getTranslation(language).error.spamCanceled);
                            fightInstance = null;
                            break;
                        }
                        fightInstance = new Fight(attacker, defender, message, language);
                        fightInstance.startFight();
                        break;
                    case "❌":
                        if (user.id === attacker.discordUser_id) {
                            message.channel.send(JsonReader.commands.fight.getTranslation(language).error.canceled);
                        } else {
                            message.channel.send(JsonReader.commands.fight.getTranslation(language).error.opponentNotAvailable);
                        }
                        fightInstance = null;
                        break;
                    default:
                        return;
                }
                collector.stop();
            });

            collector.on('end', async function () {
                if (fightInstance === undefined) {
                    if (defender == null) {
                        await message.channel.send(JsonReader.commands.fight.getTranslation(language).error.noOneAvailable);
                    } else {
                        await message.channel.send(JsonReader.commands.fight.getTranslation(language).error.opponentNotAvailable);
                    }
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
            let msg = direct ? JsonReader.commands.fight.getTranslation(language).error.levelTooLow.direct : JsonReader.commands.fight.getTranslation(language).error.levelTooLow.indirect;
            msg = format(msg, {level: FIGHT.REQUIRED_LEVEL});
            message.channel.send(msg);
            break;
        case FIGHT_ERROR.DISALLOWED_EFFECT:
            message.channel.send(direct ? JsonReader.commands.fight.getTranslation(language).error.cantFightStatus.direct : JsonReader.commands.fight.getTranslation(language).error.cantFightStatus.indirect);
            break;
        default:
            break;
    }
}

/**
 * @param entity
 * @returns {Number} error
 */
function canFight(entity) {
    if (entity == null) {
        return null;
    }
    if (entity.Player.level < FIGHT.REQUIRED_LEVEL) {
        return FIGHT_ERROR.WRONG_LEVEL;
    }
    if (entity.effect !== EFFECT.SMILEY) {
        return FIGHT_ERROR.DISALLOWED_EFFECT;
    }
    return 0;
}

const FIGHT_ERROR = {
    NONE: 0,
    WRONG_LEVEL: 1,
    DISALLOWED_EFFECT: 2
};

module.exports = {
    'fight': FightCommand,
    'f': FightCommand,
};
