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
    let player = await draftbot.repositoryManager.PlayerRepository.getByMessageOrCreate(message);

    if (player.get('health') !== 0) {
        message.channel.send(Config.text[serverLanguage].commands.respawn.thinking + message.author.username + Config.text[serverLanguage].commands.respawn.notDead);
    } else {
        const scoreRemoved = Math.round(player.get('score') * Config.PART_OF_SCORE_REMOVED_DURING_RESPAWN);
        player.set('effect', ':smiley:');
        player.set('health', player.get('maxHealth'));
        player.set('lastReport', message.createdTimestamp);
        player.changeScoreAndWeeklyScore(-scoreRemoved);

        await draftbot.repositoryManager.PlayerRepository.update(player);

        message.channel.send(Config.text[serverLanguage].commands.respawn.angel + message.author.username + Config.text[serverLanguage].commands.respawn.revived1 + scoreRemoved + Config.text[serverLanguage].commands.respawn.revived2);
    }
};

module.exports.RespawnCommand = RespawnCommand;
