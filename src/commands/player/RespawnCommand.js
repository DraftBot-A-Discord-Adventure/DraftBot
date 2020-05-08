/**
 * Allow a player who is dead to respawn
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const RespawnCommand = async (language, message, args) => {

  let [entity] = await Entities.getOrRegister(message.author.id);

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY], entity)) !== true) {
    return;
  }

  if (entity.effect !== EFFECT.SKULL) {
    await message.channel.send(format(JsonReader.commands.respawn.getTranslation(language).alive, {pseudo: message.author.username}));
  } else {
    const lostScore = Math.round(entity.Player.score * JsonReader.commands.respawn.score_remove_during_respawn);

    entity.effect = EFFECT.SMILEY;
    entity.health = entity.maxHealth;
    entity.Player.lastReportAt = require('moment').utc(message.createdAt).format('YYYY-MM-DD HH:mm:ss'); // Save to utc date
    entity.Player.addScore(-lostScore);
    entity.Player.addWeeklyScore(-lostScore);

    await Promise.all([
       entity.save(),
       entity.Player.save()
    ]);

    await message.channel.send(format(JsonReader.commands.respawn.getTranslation(language).respawn, {pseudo: message.author.username, lostScore: lostScore}));
  }
};

module.exports = {
  'respawn': RespawnCommand,
};
