const PlayerManager = require('../classes/PlayerManager');
const Text = require('../text/Francais');

/**
 * Display information about the player that sent the command
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const profileCommand = async function (message) {
    let playerManager = new PlayerManager();
    let player = await playerManager.getCurrentPlayer(message);
    let messageProfile = generateProfileMessage(message, player);
    message.channel.send(messageProfile);
}

/**
 * Returns a string containing the profile message.
 * @returns {String} - A string containing the profile message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateProfileMessage = function (message, player) {
    let playerManager = new PlayerManager();
    let profileMessage = Text.commands.profile.main + message.author.username + Text.commands.profile.level + player.getLevel() +
     Text.commands.profile.health + player.getHealth() +Text.commands.profile.separator + player.getMaxHealth() + Text.commands.profile.rank +
      playerManager.getRank(player) + Text.commands.profile.separator + playerManager.getNumberOfPlayer() + Text.commands.profile.money + player.getMoney()+
       Text.commands.profile.score + player.getScore() + Text.commands.profile.effect + player.getEffect() + playerManager.displayTimeLeft(player, message);
    return profileMessage;
};

module.exports.ProfileCommand = profileCommand;