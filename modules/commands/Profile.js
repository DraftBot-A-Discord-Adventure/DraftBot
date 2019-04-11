const PlayerManager = require('../classes/PlayerManager');
const Text = require('../text/Francais');

/**
 * Display information about the player that sent the command
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const profileCommand = async function (message) {
    let playerManager = new PlayerManager();
    let player = await playerManager.getCurrentPlayer(message);
    let numberOfPlayer = await playerManager.getNumberOfPlayers();
    let messageProfile = generateProfileMessage(message, player, numberOfPlayer);
    message.channel.send(messageProfile);
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
    if (player.getEffect() == ":baby:") {
        profileMessage = player.getEffect() + Text.commands.profile.main + message.author.username + Text.commands.profile.notAPlayer;
    } else {
        profileMessage = player.getEffect() + Text.commands.profile.main + message.author.username +
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

module.exports.ProfileCommand = profileCommand;