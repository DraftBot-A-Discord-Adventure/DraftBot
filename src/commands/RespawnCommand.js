/**
 * Allow a player who is dead to respawn
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const RespawnCommand = async (language, message, args) => {
  let player = await draftbot.getRepository('player').getByMessageOrCreate(message);

  if (player.get("health") !== 0) {
    await message.channel.send(format(Text.commands.respawn.getTranslation('fr').alive, {pseudo: message.author.username}));
  } else {
    const lostScore = Math.round(player.get("score") * Config.PART_OF_SCORE_REMOVED_DURING_RESPAWN);
    player.set("effect", ":smiley:");
    player.set("health", player.get("maxHealth"));
    player.set("lastReport", message.createdTimestamp);
    player.changeScoreAndWeeklyScore(-lostScore);

    await draftbot.getRepository('player').update(player);

    await message.channel.send(format(Text.commands.respawn.getTranslation('fr').respawn, {pseudo: message.author.username, lostScore: lostScore}));
  }
};

module.exports = {
  "respawn": RespawnCommand
};
