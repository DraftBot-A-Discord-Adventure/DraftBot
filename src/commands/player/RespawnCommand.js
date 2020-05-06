/**
 * Allow a player who is dead to respawn
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const RespawnCommand = async (language, message, args) => {

  let player = await getRepository('player').getByMessageOrCreate(message);

  if (!(await canPerformCommand(message, language, PERMISSION.ROLE.ALL, PERMISSION.EFFECT.SKULL, player))) {
    return;
  }

  if (player.effect !== EFFECT.SKULL) {
    await message.channel.send(
        format(JsonReader.commands.respawn.getTranslation(language).alive,
            {pseudo: message.author.username}));
  } else {
    const lostScore = Math.round(player.score * JsonReader.commands.respawn.score_remove_during_respawn);

    player.effect = ':smiley:';
    player.health = player.maxHealth;
    player.lastReport = message.createdTimestamp;
    player.addScore(-lostScore);
    player.addWeeklyScore(-lostScore);

    await getRepository('player').update(player);

    await message.channel.send(
        format(JsonReader.commands.respawn.getTranslation(language).respawn,
            {pseudo: message.author.username, lostScore: lostScore}));
  }
};

module.exports = {
  'respawn': RespawnCommand,
};
