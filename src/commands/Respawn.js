/**
 * Allow a player who is dead to continue playing
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param prefix
 * @param client
 * @param args - arguments typed by the user in addition to the command
 * @param serverLanguage
 * @return {Promise<void>}
 */
const RespawnCommand = async (message, prefix, client, args, serverLanguage) => {

    // TODO

    let player = await draftbot.repositoryManager.PlayerRepository.getByIdOrCreate(message.author.id);

    console.log(player);
    return;

    // if (!player.isDead()) { //player is not dead
    //     message.channel.send(Text.commands.respawn.thinking + message.author.username + Text.commands.respawn.notDead)
    // } else { //player is dead
    //     console.log(message.createdTimestamp);
    //     let scoreRemoved = playerManager.revivePlayer(player, message.createdTimestamp);
    //     message.channel.send(Text.commands.respawn.angel + message.author.username + Text.commands.respawn.revived1 + scoreRemoved + Text.commands.respawn.revived2);
    // }
};

module.exports.RespawnCommand = RespawnCommand;
