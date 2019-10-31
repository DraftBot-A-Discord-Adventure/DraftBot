const PlayerManager = require('../classes/PlayerManager');
const ServerManager = require('../classes/ServerManager');
let Text

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    let address = '../text/' + server.language;
    return require(address);
}
const Config = require('../utils/Config');

/**
 * Allow a player who is dead to continue playing
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const respawnCommand = async function (message) {
    Text = await chargeText(message);
    let playerManager = new PlayerManager();
    let player = await playerManager.getCurrentPlayer(message);

    if (!player.isDead()) { //player is not dead
        message.channel.send(Text.commands.respawn.thinking + message.author.username + Text.commands.respawn.notDead)
    } else { //player is dead
        console.log(message.createdTimestamp);
        let scoreRemoved = playerManager.revivePlayer(player,message.createdTimestamp);
        message.channel.send(Text.commands.respawn.angel + message.author.username + Text.commands.respawn.revived1 + scoreRemoved + Text.commands.respawn.revived2);
    }
}

module.exports.RespawnCommand = respawnCommand;