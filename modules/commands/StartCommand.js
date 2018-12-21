const Player = require('../Player');

/**
 * Creates a new instance of a Player, and ties it to the Discord User that used the command.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @returns {Player} - A new instance of a Player that will be tied to the poster of the message.
 */
const startCommand = function(message) {
    let player = new Player();
    player.setName(message.author.username);
    player.setDiscordId(message.author.id);
    return player;
};

module.exports.StartCommand = startCommand;