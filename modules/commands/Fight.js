const PlayerManager = require('../classes/PlayerManager');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues')
const Text = require('../text/Francais');


/**
 * Allow the user to launch a fight
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const fightCommand = async function (message) {

    let playerManager = new PlayerManager;

    let attackerPower = 1000;
    let defenderPower = 1000;
    let attacker = message.author;
    let defender = undefined;
    let spamchecker = 0;

    //loading of the current player
    let player = await playerManager.getCurrentPlayer(message);
    if (player.level < DefaultValues.fight.minimalLevel) {
        displayErrorSkillMissing(message, attacker);
    } else {
        if (playerManager.checkState(player, message, ":smiley:")) {  //check if the player is not dead or sick or something else
            playerManager.setPlayerAsOccupied(player);

            let messageIntro = await generateIntroMessage(message, attacker);
            messageIntro.react("⚔").then(a => {
                messageIntro.react("❌");
            });
            let fightIsOpen = true;

            const filter = (reaction, user) => {
                return (reactionIsCorrect(reaction, user));
            };

            const collector = messageIntro.createReactionCollector(filter, {
                time: 120000
            });

            //execute this if a user answer to the demand
            collector.on('collect', async (reaction) => {
                if (fightIsOpen) {
                    defender = reaction.users.last();

                    if (fightHasToBeCanceled(reaction)) {
                        ({ fightIsOpen, spamchecker } = treatFightCancel(defender, message, fightIsOpen, attacker, playerManager, player, spamchecker));
                    } else {
                        if (defender.id === message.author.id) { // le defenseur et l'attaquant sont la même personne
                            ({ spamchecker, fightIsOpen } = cancelFightLaunch(spamchecker, message, attacker, fightIsOpen, playerManager, player));
                        } else {// le defenseur n'est pas l'attaquant
                            let defenderPlayer = await playerManager.getPlayerById(defender.id, message);
                            if (defenderPlayer.level < DefaultValues.fight.minimalLevel) {
                                displayErrorSkillMissing(message, defender);
                            } else {
                                if (playerManager.checkState(defenderPlayer, message, ":smiley:", defender.username)) {  //check if the player is not dead or sick or something else
                                    playerManager.setPlayerAsOccupied(player);
                                    fightIsOpen = false;
                                    message.channel.send(Text.commands.fight.startStart + attacker + Text.commands.fight.startJoin + defender + Text.commands.fight.startEnd);

                                    let actualUser = attacker;
                                    let actuelPlayer = player;
                                    let opponentUser = defender;
                                    let opponentPlayer = defenderPlayer;
                                    let lastMessageFromBot = undefined;
                                    let compteur = 5;
                                    ({ lastMessageFromBot, compteur, attackerPower } = await fight(lastMessageFromBot, message, actualUser, compteur, player, attackerPower, actuelPlayer, opponentPlayer, opponentUser, attacker, defender, defenderPlayer));


                                    //what happen when someone loose
                                    /*
                                    TODO
                                    */
                                }
                            }
                        }
                    }
                }
            });

            //end of the time the users have to answer to the demand
            collector.on('end', () => {
                if (fightIsOpen) {
                    message.channel.send(Text.commands.fight.errorEmoji + attacker + Text.commands.fight.noAnswerError);
                    playerManager.setPlayerAsUnOccupied(player);
                }
            });
        }
    }
};

async function fight(lastMessageFromBot, message, actualUser, compteur, player, attackerPower, actuelPlayer, opponentPlayer, opponentUser, attacker, defender, defenderPlayer) {
    lastMessageFromBot = await displayFightMenu(lastMessageFromBot, message, actualUser);
    let playerHasResponded = true;

    const filter = (reaction, user) => {
        return (reactionFightIsCorrect(reaction, user));
    };

    const collector = lastMessageFromBot.createReactionCollector(filter, {
        time: 30000
    });

    //execute this if a user answer to the demand
    collector.on('collect', async (reaction) => {
        if (playerHasResponded) {
            playerHasResponded = false;
            if (reaction.users.last() === actualUser) { //On check que c'est le bon joueur qui réagis
                compteur = compteur - 1;
                let puissanceAttaque = player.attack;
                console.log(puissanceAttaque);
                attackerPower = attackerPower - 30;
                switch (reaction.name) {
                    case "🗡": //attaque rapide
                    // Bonus de 20% sur un adversaire plus lent
                    // Malus de 80% sur un adversaire plus fort en défense

                        break;
                    case "⚔": //attaque simple
                    // Malus de 60 % sur un adversaire plus fort en défense
                    // Malus de 30 % sur un adversaire plus rapide
                        break;
                    case "💣": //attaque ultime
                    // Malus de 90 % sur un adversaire plus rapide
                        break;
                    case "🛡": //defendre
                    // augmente la défense de 30 points
                        break;
                    default: // esquive
                    // augmente la vitesse de 30 points
                        break;
                }
                ({ actualUser, actuelPlayer, opponentPlayer, opponentUser } = switchActiveUser(actualUser, attacker, defender, actuelPlayer, defenderPlayer, player, opponentPlayer, opponentUser));
                ({ lastMessageFromBot, compteur, attackerPower } = await fight(lastMessageFromBot, message, actualUser, compteur, player, attackerPower, actuelPlayer, opponentPlayer, opponentUser, attacker, defender, defenderPlayer));
            }
        }
    });
    //end of the time the users have to answer to the demand
    collector.on('end', () => {
        if (playerHasResponded) { //the player has quit the fight
            playerHasResponded = false;
        }
    });

    return { lastMessageFromBot, compteur, attackerPower };
}

async function displayFightMenu(lastMessageFromBot, message, actualUser) {
    lastMessageFromBot = await message.channel.send(Text.commands.fight.menuStart + actualUser + Text.commands.fight.menuEnd);
    lastMessageFromBot.react("⚔");
    lastMessageFromBot.react("🗡");
    lastMessageFromBot.react("💣");
    lastMessageFromBot.react("🛡");
    lastMessageFromBot.react("🚀");
    return lastMessageFromBot;
}

function displayErrorSkillMissing(message, user) {
    message.channel.send(Text.commands.fight.errorEmoji + user + Text.commands.fight.notEnoughSkillError1 + DefaultValues.fight.minimalLevel + Text.commands.fight.notEnoughSkillError2);
}

function switchActiveUser(actualUser, attacker, defender, actuelPlayer, defenderPlayer, player) {
    if (actualUser == attacker) {
        actualUser = defender;
        actuelPlayer = defenderPlayer;
        opponentUser = defender;
        opponentPlayer = defenderPlayer;
    }
    else {
        actualUser = attacker;
        actuelPlayer = player;
        opponentUser = defender;
        opponentPlayer = defenderPlayer;
    }
    return { actualUser, actuelPlayer };
}

function cancelFightLaunch(spamchecker, message, attacker, fightIsOpen, playerManager, player) {
    spamchecker++;
    message.channel.send(Text.commands.fight.errorEmoji + attacker + Text.commands.fight.alreadyAttackerError);
    if (spamchecker > 1) {
        message.channel.send(Text.commands.fight.errorEmoji + attacker + Text.commands.fight.spamError);
        fightIsOpen = false;
        playerManager.setPlayerAsUnOccupied(player);
    }
    return { spamchecker, fightIsOpen };
}

function treatFightCancel(defender, message, fightIsOpen, attacker, playerManager, player, spamchecker) {
    if (defender.id === message.author.id) { // le defenseur et l'attaquant sont la même personne
        fightIsOpen = cancelFight(message, attacker, fightIsOpen, playerManager, player);
    }
    else { // le defenseur n'est pas l'attaquant
        if (spamchecker < 3) {
            spamchecker++;
            message.channel.send(Text.commands.fight.errorEmoji + defender + Text.commands.fight.fightNotCanceled);
        }
    }
    return { fightIsOpen, spamchecker };
}


/**
 * 
 * @param {*} message - The message that caused the fight to be created
 * @param {*} attacker - The attacker
 * @param {Boolean} fightIsOpen - Is true if the fight has not already been canceled or launched
 * @param {*} playerManager - The player manager
 * @param {*} player - the attacker
 */
function cancelFight(message, attacker, fightIsOpen, playerManager, player) {
    message.channel.send(Text.commands.fight.validEmoji + attacker + Text.commands.fight.fightCanceled);
    fightIsOpen = false;
    playerManager.setPlayerAsUnOccupied(player);
    return fightIsOpen;
}


/**
 * check if the reaction recieved correspond to a fight cancel
 * @param {*} reaction - The reaction that has been recieved
 */
function fightHasToBeCanceled(reaction) {
    return reaction.emoji.name == "❌";
}

/**
 * Allow to display the intro message that will taunch the fight
 * @param {*} message - The message that caused the function to be called. Used to retrieve the channel of the message.
 * @param {*} attacker - The attacker that asked for the fight
 */

async function generateIntroMessage(message, attacker) {
    return await message.channel.send(Text.commands.fight.startEmoji + attacker.username + Text.commands.fight.startIntro);
}

/**
 * Allow to check if someone looses during the previous round
 * @param {Number} attackerPower - The power of the attacker
 * @param {Number} defenderPower - The power of his opponent
 */
function nobodyLooses(attackerPower, defenderPower) {
    return attackerPower > 0 && defenderPower > 0;
}

/**
* Check if the reaction recieved is valid
* @param {*} reaction - The reaction recieved
* @returns {Boolean} - true is the reaction is correct
*/
const reactionIsCorrect = function (reaction, user) {
    let contains = false;
    if (reaction.emoji.name == "⚔" && !user.bot) {
        contains = true;
    }
    if (reaction.emoji.name == "❌" && !user.bot) {
        contains = true;
    }
    return contains
}

/**
* Check if the reaction recieved is valid
* @param {*} reaction - The reaction recieved
* @returns {Boolean} - true is the reaction is correct
*/
const reactionFightIsCorrect = function (reaction, user) {
    let contains = false;
    if (reaction.emoji.name == "⚔" && !user.bot) {
        contains = true;
    }
    if (reaction.emoji.name == "🗡" && !user.bot) {
        contains = true;
    }
    if (reaction.emoji.name == "💣" && !user.bot) {
        contains = true;
    }
    if (reaction.emoji.name == "🛡" && !user.bot) {
        contains = true;
    }
    if (reaction.emoji.name == "🚀" && !user.bot) {
        contains = true;
    }
    return contains
}


module.exports.FightCommand = fightCommand;