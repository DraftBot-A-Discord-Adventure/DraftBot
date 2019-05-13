const PlayerManager = require('../classes/PlayerManager');
const Text = require('../text/Francais');

/**
 * Display information about the player that sent the command
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const profileCommand = async function (message, args) {
    let playerManager = new PlayerManager();
    let player = await playerManager.getCurrentPlayer(message);
    if (askForAnotherPlayer(args)) {
        let playerId = args[1];
        player = await getAskedPlayer(playerId, player, playerManager, message);
        if (askedPlayerIsInvalid(player))
            return message.channel.send(Text.commands.profile.errorMain + message.author.username + Text.commands.profile.errorExp)
    }
    let numberOfPlayer = await playerManager.getNumberOfPlayers();
    let messageProfile = generateProfileMessage(message, player, numberOfPlayer);
    message.channel.send(messageProfile).then(msg => {
        displayBadges(player, msg);
    });

}

/**
 * Returns a string containing the profile message.
 * @returns {String} - A string containing the profile message.
 * @param message - The message that caused the function to be called. Used to retrieve the channel of the message.
 * @param player - The player that send the message
 * @param numberOfPlayer - The total number of player in the database
 */
const generateProfileMessage = function (message, player, numberOfPlayer) {
    let playerManager = new PlayerManager();
    let profileMessage;
    let pseudo;
    try {
        pseudo = message.mentions.users.last().username;
    } catch (err) {
        pseudo = message.author.username;
    }

    if (player.getEffect() == ":baby:") {
        profileMessage = player.getEffect() + Text.commands.profile.main + pseudo + Text.commands.profile.notAPlayer;
    } else {
        profileMessage = player.getEffect() + Text.commands.profile.main + pseudo +
            Text.commands.profile.level + player.getLevel() +
            Text.commands.profile.xp + player.getExperience() + Text.commands.profile.separator + player.getExperienceToLevelUp() +
            Text.commands.profile.health + player.getHealth() + Text.commands.profile.separator + player.getMaxHealth() +
            Text.commands.profile.statsAttack + player.getAttack() + Text.commands.profile.statsDefense + player.getDefense() + Text.commands.profile.statsSpeed + player.getSpeed() +
            Text.commands.profile.rank + player.getRank() + Text.commands.profile.separator + numberOfPlayer +
            Text.commands.profile.money + player.getMoney() +
            Text.commands.profile.score + player.getScore() +
            playerManager.displayTimeLeft(player, message);
    }
    return profileMessage;
};

/**
 * Allow to recover the asked player if needed
 * @param {*} playerId - The asked id of the player
 * @param {*} player - The player that is asked for
 * @param {*} playerManager - The player manager
 * @param {*} message - The message that initiate the command
 */
async function getAskedPlayer(playerId, player, playerManager, message) {
    playerId = playerId.substring(2, playerId.length - 1);
    player = await playerManager.getPlayerById(playerId, message);
    return player;
}

/**
 * check if the asked player is valid
 * @param {*} player - The player that has been asked for
 */
function askedPlayerIsInvalid(player) {
    return player.getEffect() == ":baby:";
}

/**
 * check if the user ask for its own profile or the one of someone else
 * @param {*} args - The args given by the user that made the command
 */
function askForAnotherPlayer(args) {
    return args[1] != undefined;
}

/**
 * display the badges of the player if he have some
 * @param {*} player - The player that is displayed
 * @param {*} msg - The message that contain the profile of the player
 */
function displayBadges(player, msg) {
    if (player.getBadges() != "") {
        let str = player.getBadges();
        for (var i = 0; i < str.length; i++) {
            msg.react(str.charAt(i)).catch(err => { });
        }
    }
}

module.exports.ProfileCommand = profileCommand;


