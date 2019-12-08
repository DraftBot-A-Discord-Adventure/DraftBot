const PlayerManager = require('../classes/PlayerManager');
const InventoryManager = require('../classes/InventoryManager');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues')
const ServerManager = require('../classes/ServerManager');
let Text;
let language;

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Allow to get the language the bot has to respond with
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @returns {string} - the code of the server language
 */
const detectLanguage = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    return server.language;;
}

/**
 * Allow the user to launch a fight
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const fightCommand = async function (message, args, client, talkedRecently) {
    Text = await chargeText(message);
    language = await detectLanguage(message);
    if (talkedRecently.has(message.author.id)) {
        return message.channel.send(Text.commands.sell.cancelStart + message.author + Text.commands.shop.tooMuchShop);
    }
    let playerManager = new PlayerManager;
    let inventoryManager = new InventoryManager;
    let attacker = message.author;
    let defender = undefined;
    let spamchecker = 0;
    let attackerDefenseAdd = 20;
    let defenderDefenseAdd = 20;
    let attackerSpeedAdd = 30;
    let defenderSpeedAdd = 30;
    let nbTours = 0;
    //loading of the current player
    let player = await playerManager.getCurrentPlayer(message);

    if (player.level < DefaultValues.fight.minimalLevel) {
        displayErrorSkillMissing(message, attacker);
    } else {
        if (playerManager.checkState(player, message, ":smiley:", language)) {  //check if the player is not dead or sick or something else
            playerManager.setPlayerAsOccupied(player);

            let messageIntro = await displayIntroMessage(message, attacker);

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
                                if (talkedRecently.has(defender.id)) {
                                    return message.channel.send(Text.commands.sell.cancelStart + defender + Text.commands.shop.tooMuchShop);
                                }
                                if (playerManager.checkState(defenderPlayer, message, ":smiley:", language, defender.username)) {  //check if the player is not dead or sick or something else
                                    playerManager.setPlayerAsOccupied(defenderPlayer);
                                    fightIsOpen = false;
                                    displayFightStartMessage(message, attacker, defender);
                                    let actualUser = attacker;
                                    let actuelPlayer = player;
                                    let opponentUser = defender;
                                    let opponentPlayer = defenderPlayer;
                                    let lastMessageFromBot = undefined;
                                    let lastEtatFight = undefined;
                                    let attackerPower = player.maxHealth + player.level * 10;
                                    let defenderPower = defenderPlayer.maxHealth + defenderPlayer.level * 10;

                                    await addItemBonus(inventoryManager, player, defenderPlayer);

                                    fight(lastMessageFromBot, message, actualUser, player, actuelPlayer, opponentPlayer, opponentUser, attacker, defender, defenderPlayer, attackerPower, defenderPower, defenderDefenseAdd, attackerDefenseAdd, lastEtatFight, attackerSpeedAdd, defenderSpeedAdd, nbTours);
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

/**
 * Allow to add to the player stats the bonuses of its items
 * @param {*} inventoryManager - The inventory manager
 * @param {*} player - One of the player that has to recieve the bonuses
 * @param {*} defenderPlayer - The other one
 */
async function addItemBonus(inventoryManager, player, defenderPlayer) {
    let bonus = await inventoryManager.getDamageById(player.id);
    player.attack = player.attack + bonus;
    bonus = await inventoryManager.getDamageById(defenderPlayer.id);
    defenderPlayer.attack = defenderPlayer.attack + bonus;
    bonus = await inventoryManager.getDefenseById(player.id);
    player.defense = player.defense + bonus;
    bonus = await inventoryManager.getDefenseById(defenderPlayer.id);
    defenderPlayer.defense = defenderPlayer.defense + bonus;
    bonus = await inventoryManager.getSpeedById(player.id);
    player.speed = player.speed + bonus;
    bonus = await inventoryManager.getSpeedById(defenderPlayer.id);
    defenderPlayer.speed = defenderPlayer.speed + bonus;
}

/**
 * Allow to display the message that announce the begining of the fight
 * @param {*} message 
 * @param {*} attacker - The first player
 * @param {*} defender 
 */
function displayFightStartMessage(message, attacker, defender) {
    message.channel.send(Text.commands.fight.startStart + attacker + Text.commands.fight.startJoin + defender + Text.commands.fight.startEnd);
}

async function displayIntroMessage(message, attacker) {
    let messageIntro = await generateIntroMessage(message, attacker);
    messageIntro.react("⚔").then(a => {
        messageIntro.react("❌");
    });
    return messageIntro;
}


/**
 * Allow to make one round of the fight
 * @param {*} lastMessageFromBot 
 * @param {*} message 
 * @param {*} actualUser - The user that is currently playing 
 * @param {*} player - The first player
 * @param {*} actuelPlayer 
 * @param {*} opponentPlayer 
 * @param {*} opponentUser 
 * @param {*} attacker - The first player
 * @param {*} defender 
 * @param {*} defenderPlayer 
 * @param {*} attackerPower 
 * @param {*} defenderPower 
 * @param {*} defenderDefenseAdd 
 * @param {*} attackerDefenseAdd 
 * @param {*} lastEtatFight 
 * @param {*} attackerSpeedAdd 
 * @param {*} defenderSpeedAdd 
 * @param {*} nbTours 
 */
async function fight(lastMessageFromBot, message, actualUser, player, actuelPlayer, opponentPlayer, opponentUser, attacker, defender, defenderPlayer, attackerPower, defenderPower, defenderDefenseAdd, attackerDefenseAdd, lastEtatFight, attackerSpeedAdd, defenderSpeedAdd, nbTours) {
    let actualUserPoints = 0;
    let opponentUserPoints = 0;
    if (actualUser == attacker) {
        actualUserPoints = attackerPower;
        opponentUserPoints = defenderPower;
    } else {
        actualUserPoints = defenderPower;
        opponentUserPoints = attackerPower;
    }
    if (lastMessageFromBot != undefined)
        lastMessageFromBot.delete(5000).catch();
    if (lastEtatFight != undefined)
        lastEtatFight.delete(5000).catch();
    lastEtatFight = await message.channel.send(Text.commands.fight.statusIntro + Text.commands.fight.attackerEmoji + actualUser.username +
        Text.commands.fight.statusPoints + actualUserPoints + Text.commands.profile.statsAttack + actuelPlayer.attack +
        Text.commands.profile.statsDefense + actuelPlayer.defense + Text.commands.profile.statsSpeed + actuelPlayer.speed +
        Text.commands.fight.endLine + Text.commands.fight.defenderEmoji + opponentUser.username +
        Text.commands.fight.statusPoints + opponentUserPoints + Text.commands.profile.statsAttack + opponentPlayer.attack +
        Text.commands.profile.statsDefense + opponentPlayer.defense + Text.commands.profile.statsSpeed + opponentPlayer.speed)


    lastMessageFromBot = await displayFightMenu(message, actualUser);

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
            if (reaction.users.last() === actualUser) { //On check que c'est le bon joueur qui réagis
                playerHasResponded = false;
                let attackPower;
                switch (reaction.emoji.name) {
                    case "🗡": //attaque rapide
                        // 85% des points d'attaque sont utilisés
                        // Taux de réussite de 30% qui monte à 95% sur un adversaire plus lent
                        ({ defenderPower, attackerPower } = quickAttack(attackPower, player, opponentPlayer, actuelPlayer, defenderPower, attackerPower, attacker, actualUser, reaction, message));
                        break;
                    case "⚔": //attaque simple
                        // 100% des points d'attaque sont utilisés
                        // Taux de réussite de 60% qui monte à 70% sur un adversaire plus lent
                        ({ defenderPower, attackerPower } = simpleAttack(attackPower, player, opponentPlayer, actuelPlayer, defenderPower, attackerPower, attacker, actualUser, reaction, message));
                        break;
                    case "💣": //attaque ultime
                        // 150% ou 200% des points d'attaque sont utilisés
                        // Diminue la vitesse de 10 % pour le prochain tour
                        // 5% de réussite totale sur un adversaire plus rapide et 10% de réussite partielle
                        // 20% de réussite totale sur un adversaire plus lent et 40% de réusite partielle
                        ({ defenderPower, attackerPower } = powerfullAttack(attackPower, player, opponentPlayer, actuelPlayer, defenderPower, attackerPower, attacker, actualUser, reaction, message));
                        break;
                    case "🛡": //defendre
                        // augmente la défense
                        ({ attackerDefenseAdd, defenderDefenseAdd } = ImproveDefense(actualUser, attacker, actuelPlayer, attackerDefenseAdd, message, reaction, defenderDefenseAdd));
                        break;
                    default: // esquive
                        // augmente la vitesse de 30 points
                        ({ attackerSpeedAdd, defenderSpeedAdd } = ImproveSpeed(actualUser, attacker, actuelPlayer, attackerSpeedAdd, message, reaction, defenderSpeedAdd));
                        break;
                }
                ({ actualUser, actuelPlayer, opponentPlayer, opponentUser } = switchActiveUser(actualUser, attacker, defender, actuelPlayer, defenderPlayer, player, opponentPlayer, opponentUser));
                if (nobodyLooses(attackerPower, defenderPower)) {
                    if (nbTours < 25) {
                        nbTours++;
                        fight(lastMessageFromBot, message, actualUser, player, actuelPlayer, opponentPlayer, opponentUser, attacker, defender, defenderPlayer, attackerPower, defenderPower, defenderDefenseAdd, attackerDefenseAdd, lastEtatFight, attackerSpeedAdd, defenderSpeedAdd, nbTours);
                    } else {
                        let playerManager = new PlayerManager();
                        playerManager.setPlayerAsUnOccupied(player);
                        playerManager.setPlayerAsUnOccupied(defenderPlayer);
                        message.channel.send(Text.commands.fight.finStart + attacker + Text.commands.fight.finEgalite + defender + Text.commands.fight.finEgaliteEnd);
                    }
                } else {
                    finDeCombat(player, defenderPlayer, attackerPower, defender, attacker, message, lastMessageFromBot, lastEtatFight);
                }
            }
        }
    });
    //end of the time the users have to answer to the demand
    collector.on('end', () => {
        if (playerHasResponded) { //the player has quit the fight
            playerHasResponded = false;
            if (actualUser == attacker) {
                attackerPower = 0;
            }
            finDeCombat(player, defenderPlayer, attackerPower, defender, attacker, message, lastMessageFromBot, lastEtatFight);
        }
    });
}

/**
 * Allow to end properly a fight
 * @param {*} player - The first player
 * @param {*} defenderPlayer - The other player
 * @param {*} attackerPower - The current power point of the first player
 * @param {*} defender - The second User
 * @param {*} attacker - The first User
 * @param {*} message - The message that ran the command
 * @param {*} lastMessageFromBot - The las message the bot has send
 * @param {*} lastEtatFight - The last message containing the stats of the fight the bot sent
 */
function finDeCombat(player, defenderPlayer, attackerPower, defender, attacker, message, lastMessageFromBot, lastEtatFight) {
    let elo = 0;
    let messageFinCombat;
    elo = calculateElo(player, defenderPlayer, elo);
    let pts;
    if (attackerPower <= 0) { //the attacker has loose
        pts = Math.round(100 + 10 * player.level * Math.round((player.score / defenderPlayer.score) * 100) / 100);
        messageFinCombat = Text.commands.fight.finStart + defender + Text.commands.fight.finDebut + attacker +
            Text.commands.fight.finEndLine + elo + Text.commands.fight.finPts + pts + Text.commands.fight.finFin;
        player.score = player.score - pts;
        defenderPlayer.score = defenderPlayer.score + pts;
    }
    else { //the defender has loose
        pts = Math.round(100 + 10 * defenderPlayer.level * Math.round((defenderPlayer.score / player.score) * 100) / 100);
        messageFinCombat = Text.commands.fight.finStart + attacker + Text.commands.fight.finDebut + defender +
            Text.commands.fight.finEndLine + elo + Text.commands.fight.finPts + pts + Text.commands.fight.finFin;
        player.score = player.score + pts;
        defenderPlayer.score = defenderPlayer.score - pts;
    }
    let playerManager = new PlayerManager;
    playerManager.updatePlayerScore(player);
    playerManager.updatePlayerScore(defenderPlayer);
    playerManager.setPlayerAsUnOccupied(player);
    playerManager.setPlayerAsUnOccupied(defenderPlayer);

    message.channel.send(messageFinCombat);
    if (lastMessageFromBot != undefined)
        lastMessageFromBot.delete(5000).catch();
    if (lastEtatFight != undefined)
        lastEtatFight.delete(5000).catch();
}

/**
 * Allow to calculate the elo fo the game
 * @param {*} player - The first player
 * @param {*} defenderPlayer - The other player
 * @param {*} elo - The elo
 */
function calculateElo(player, defenderPlayer, elo) {
    if (player.score < defenderPlayer.score) {
        elo = Math.round((player.score / defenderPlayer.score) * 100) / 100;
    }
    else {
        elo = Math.round((defenderPlayer.score / player.score) * 100) / 100;
    }
    return elo;
}

/**
 * Allow to improve the defense stats of a player
 * @param {*} actualUser - The user that is currently playing
 * @param {*} attacker - The first player
 * @param {*} actuelPlayer - The player that is currently playing
 * @param {*} attackerDefenseAdd - The amount of defense the bot has to give to the attacker
 * @param {*} message - The message that ran the command
 * @param {*} reaction - The reaction the user clicked on
 * @param {*} defenderDefenseAdd - The amount of defense the bot has to give to the defender
 */
function ImproveDefense(actualUser, attacker, actuelPlayer, attackerDefenseAdd, message, reaction, defenderDefenseAdd) {
    if (actualUser == attacker) {
        actuelPlayer.defense += attackerDefenseAdd + Tools.generateRandomNumber(0, 5);
        message.channel.send(reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.defenseAdd + attackerDefenseAdd + Text.commands.fight.degatsOutro);
        attackerDefenseAdd = Math.floor(attackerDefenseAdd * 0.5);
    }
    else {
        actuelPlayer.defense += defenderDefenseAdd;
        message.channel.send(reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.defenseAdd + defenderDefenseAdd + Text.commands.fight.degatsOutro);
        defenderDefenseAdd = Math.floor(defenderDefenseAdd * 0.5);
    }
    return { attackerDefenseAdd, defenderDefenseAdd };
}

/**
 * Allow to improve the speed stats of a player
 * @param {*} actualUser - The user that is currently playing
 * @param {*} attacker - The first player
 * @param {*} actuelPlayer - The player that is currently playing
 * @param {*} attackerSpeedAdd - The amount of speed the bot has to give to the attacker
 * @param {*} message - The message that ran the command
 * @param {*} reaction - The reaction the user clicked on
 * @param {*} defenderSpeedAdd - The amount of speed the bot has to give to the defender
 */
function ImproveSpeed(actualUser, attacker, actuelPlayer, attackerSpeedAdd, message, reaction, defenderSpeedAdd) {
    if (actualUser == attacker) {
        actuelPlayer.speed += attackerSpeedAdd + Tools.generateRandomNumber(0, 5);
        message.channel.send(reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.speedAdd + attackerSpeedAdd + Text.commands.fight.degatsOutro);
        attackerSpeedAdd = Math.floor(attackerSpeedAdd * 0.5);
    }
    else {
        actuelPlayer.speed += defenderSpeedAdd;
        message.channel.send(reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.speedAdd + defenderSpeedAdd + Text.commands.fight.degatsOutro);
        defenderSpeedAdd = Math.floor(defenderSpeedAdd * 0.5);
    }
    return { attackerSpeedAdd, defenderSpeedAdd };
}

/**
 * Allow to pake a powerfull attack
 * @param {*} attackPower 
 * @param {*} player - The first player
 * @param {*} opponentPlayer 
 * @param {*} actuelPlayer 
 * @param {*} defenderPower 
 * @param {*} attackerPower 
 * @param {*} attacker - The first player 
 * @param {*} actualUser - The user that is currently playing 
 * @param {*} reaction 
 * @param {*} message 
 */
function powerfullAttack(attackPower, player, opponentPlayer, actuelPlayer, defenderPower, attackerPower, attacker, actualUser, reaction, message) {
    //test which player is quicker
    let succes = Tools.generateRandomNumber(1, 100);
    let powerchanger = 0;
    if (opponentPlayer.speed > actuelPlayer.speed) {
        if (succes <= 15 && succes > 5) { //partial success
            powerchanger = 1.25;
        }
        if (succes <= 5) { // total success
            powerchanger = 2;
        }
    }else{
        if (succes <= 60 && succes > 20) { //partial success
            powerchanger = 1.25;
        }
        if (succes <= 20) { // total success
            powerchanger = 2;
        } 
    }
    attackPower = player.attack * powerchanger;
    //lower speed for next turn
    actuelPlayer.speed = Math.round(actuelPlayer.speed * 0.9);
    let messageAttaqueUltime = "";
    let defensePower = opponentPlayer.defense;
    let degats = attackPower - Math.round(defensePower * 0.5);
    let random = Tools.generateRandomNumber(1, 8);
    if (degats > 0) {
        if (powerchanger ==2) {
            ({ defenderPower, attackerPower } = updatePlayerPower(attacker, actualUser, defenderPower, degats, attackerPower));
            messageAttaqueUltime = reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.attackUltime.ok[random] + Text.commands.fight.degatsIntro + degats + Text.commands.fight.degatsOutro;
        } else {
            ({ defenderPower, attackerPower } = updatePlayerPower(attacker, actualUser, defenderPower, degats, attackerPower));
            messageAttaqueUltime = reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.attackUltime.meh[random] + Text.commands.fight.degatsIntro + degats + Text.commands.fight.degatsOutro;
        }
    }
    else {
        degats = 0;
        messageAttaqueUltime = reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.attackUltime.ko[random] + Text.commands.fight.degatsIntro + degats + Text.commands.fight.degatsOutro;
    }
    message.channel.send(messageAttaqueUltime);
    return { defenderPower, attackerPower };
}

/**
 * allow to perform a basic attack
 * @param {*} attackPower 
 * @param {*} player - The first player
 * @param {*} opponentPlayer 
 * @param {*} actuelPlayer 
 * @param {*} defenderPower 
 * @param {*} attackerPower 
 * @param {*} attacker - The first player 
 * @param {*} actualUser - The user that is currently playing 
 * @param {*} reaction 
 * @param {*} message 
 */
function simpleAttack(attackPower, player, opponentPlayer, actuelPlayer, defenderPower, attackerPower, attacker, actualUser, reaction, message) {
    let succes = Tools.generateRandomNumber(1, 100);
    let powerchanger = 0.1;
    if (opponentPlayer.speed > actuelPlayer.speed) {
       if (succes <= 60) { // total success
            powerchanger = 1;
        }
    }else{
        if (succes <= 70) { // total success
            powerchanger = 1;
        } 
    }
    attackPower = player.attack * powerchanger;
    let messageAttaqueSimple = "";
    let defensePower = opponentPlayer.defense;
    let degats = attackPower - Math.round(defensePower * 0.5);
    let random = Tools.generateRandomNumber(1, 8);
    if (degats > 0) {
        if (degats >= 100) {
            ({ defenderPower, attackerPower } = updatePlayerPower(attacker, actualUser, defenderPower, degats, attackerPower));
            messageAttaqueSimple = reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.attackSimple.ok[random] + Text.commands.fight.degatsIntro + degats + Text.commands.fight.degatsOutro;
        }
        else {
            ({ defenderPower, attackerPower } = updatePlayerPower(attacker, actualUser, defenderPower, degats, attackerPower));
            messageAttaqueSimple = reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.attackSimple.meh[random] + Text.commands.fight.degatsIntro + degats + Text.commands.fight.degatsOutro;
        }
    }
    else {
        degats = 0;
        messageAttaqueSimple = reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.attackSimple.ko[random] + Text.commands.fight.degatsIntro + degats + Text.commands.fight.degatsOutro;
    }
    message.channel.send(messageAttaqueSimple);
    return { defenderPower, attackerPower };
}

/**
 * Allow to perform a quick attack
 * @param {*} attackPower 
 * @param {*} player - The first player
 * @param {*} opponentPlayer 
 * @param {*} actuelPlayer 
 * @param {*} defenderPower 
 * @param {*} attackerPower 
 * @param {*} attacker - The first player
 * @param {*} actualUser - The user that is currently playing 
 * @param {*} reaction 
 * @param {*} message 
 */
function quickAttack(attackPower, player, opponentPlayer, actuelPlayer, defenderPower, attackerPower, attacker, actualUser, reaction, message) {
    let succes = Tools.generateRandomNumber(1, 100);
    let powerchanger = 0.1;
    if (opponentPlayer.speed > actuelPlayer.speed) {
       if (succes <= 30) { // total success
            powerchanger = 0.85;
        }
    }else{
        if (succes <= 80) { // total success
            powerchanger = 0.85;
        } 
    }
    attackPower = player.attack * powerchanger;
    let messageAttaqueRapide = "";
    let defensePower = opponentPlayer.defense;
    let degats = attackPower - Math.round(defensePower * 0.25);
    let random = Tools.generateRandomNumber(1, 8);
    if (degats > 0) {
        if (degats >= actuelPlayer.attack - defensePower) {
            ({ defenderPower, attackerPower } = updatePlayerPower(attacker, actualUser, defenderPower, degats, attackerPower));
            messageAttaqueRapide = reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.attackRapide.ok[random] + Text.commands.fight.degatsIntro + degats + Text.commands.fight.degatsOutro;
        }
        else {
            ({ defenderPower, attackerPower } = updatePlayerPower(attacker, actualUser, defenderPower, degats, attackerPower));
            messageAttaqueRapide = reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.attackRapide.meh[random] + Text.commands.fight.degatsIntro + degats + Text.commands.fight.degatsOutro;
        }
    }
    else {
        degats = 0;
        messageAttaqueRapide = reaction.emoji.name + Text.commands.fight.endIntroStart + actualUser.username + Text.commands.fight.attackRapide.ko[random] + Text.commands.fight.degatsIntro + degats + Text.commands.fight.degatsOutro;
    }
    message.channel.send(messageAttaqueRapide);
    return { defenderPower, attackerPower };
}

/**
 * 
 * @param {*} attacker - The first player
 * @param {*} actualUser - The user that is currently playing 
 * @param {*} defenderPower 
 * @param {*} degats 
 * @param {*} attackerPower 
 */
function updatePlayerPower(attacker, actualUser, defenderPower, degats, attackerPower) {
    if (attacker == actualUser) {
        defenderPower = defenderPower - degats;
    }
    else {
        attackerPower = attackerPower - degats;
    }
    return { defenderPower, attackerPower };
}

/**
 * 
 * @param {*} message 
 * @param {*} actualUser - The user that is currently playing 
 */
async function displayFightMenu(message, actualUser) {
    let lastMessageFromBot = await message.channel.send(Text.commands.fight.menuStart + actualUser + Text.commands.fight.menuEnd);
    await lastMessageFromBot.react("⚔");
    await lastMessageFromBot.react("🗡");
    await lastMessageFromBot.react("💣");
    await lastMessageFromBot.react("🛡");
    await lastMessageFromBot.react("🚀");
    return lastMessageFromBot;
}

/**
 * 
 * @param {*} message 
 * @param {*} user 
 */
function displayErrorSkillMissing(message, user) {
    message.channel.send(Text.commands.fight.errorEmoji + user + Text.commands.fight.notEnoughSkillError1 + DefaultValues.fight.minimalLevel + Text.commands.fight.notEnoughSkillError2);
}

/**
 * 
 * @param {*} actualUser - The user that is currently playing 
 * @param {*} attacker - The first player
 * @param {*} defender 
 * @param {*} actuelPlayer 
 * @param {*} defenderPlayer 
 * @param {*} player - The first player
 */
function switchActiveUser(actualUser, attacker, defender, actuelPlayer, defenderPlayer, player) {
    if (actualUser == attacker) {
        actualUser = defender;
        actuelPlayer = defenderPlayer;
        opponentUser = attacker;
        opponentPlayer = player;
    }
    else {
        actualUser = attacker;
        actuelPlayer = player;
        opponentUser = defender;
        opponentPlayer = defenderPlayer;
    }
    return { actualUser, actuelPlayer, opponentUser, opponentPlayer };
}

/**
 * 
 * @param {*} spamchecker 
 * @param {*} message 
 * @param {*} attacker - The first player
 * @param {*} fightIsOpen 
 * @param {*} playerManager 
 * @param {*} player - The first player
 */
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

/**
 * 
 * @param {*} defender 
 * @param {*} message 
 * @param {*} fightIsOpen 
 * @param {*} attacker - The first player
 * @param {*} playerManager 
 * @param {*} player - The first player
 * @param {*} spamchecker 
 */
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
 * Allow to cancel a fight
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
 * Check if the reaction recieved correspond to a fight cancel
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