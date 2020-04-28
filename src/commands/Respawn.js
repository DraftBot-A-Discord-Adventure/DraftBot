/**
 * Allow a player who is dead to respawn
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const RespawnCommand = async (language, message, args) => {
  let player = await draftbot.getRepository('player').getByMessageOrCreate(message);

  if (player.get("health") !== 0) {
    await message.channel.send(Config.text[language].commands.respawn.thinking + message.author.username +
      Config.text[language].commands.respawn.notDead);
  } else {
    const scoreRemoved = Math.round(player.get("score") * Config.PART_OF_SCORE_REMOVED_DURING_RESPAWN);
    player.set("effect", ":smiley:");
    player.set("health", player.get("maxHealth"));
    player.set("lastReport", message.createdTimestamp);
    player.changeScoreAndWeeklyScore(-scoreRemoved);

    await draftbot.getRepository('player').update(player);

    await message.channel.send(Config.text[language].commands.respawn.angel + message.author.username +
      Config.text[language].commands.respawn.revived1 + scoreRemoved + Config.text[language].commands.respawn.revived2);
  }
};

module.exports.RespawnCommand = RespawnCommand;
