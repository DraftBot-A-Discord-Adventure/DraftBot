/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ProfileCommand = async function(language, message, args) {
  let player;
  if (args.length === 0) {
    player = await getRepository('player').getByMessageOrCreate(message);

    if (player.effect === EFFECT.BABY) {
      return await error(message, language,
          JsonReader.error.getTranslation(language).meIsBaby);
    }
  } else {
    player = await getRepository('player').getByArgs(args, message);

    if (player.effect === EFFECT.BABY) {
      return await error(message, language,
          format(JsonReader.error.getTranslation(language).playerIsBaby,
              {askedPseudo: player.getPseudo(language)}));
    }
  }

  let profileEmbed = await player.toEmbedObject(language, message);
  return message.channel.send(
      new discord.MessageEmbed()
          .setColor(JsonReader.bot.embed.default)
          .setTitle(profileEmbed.title)
          .addFields(profileEmbed.fields),
  ).then(async msg => {
    if (player.badges !== null) {
      let badges = player.badges.split('-');
      for (let i = 0; i < badges.length; i++) {
        await msg.react(badges[i]);
      }
    }
  });

};

module.exports = {
  'profile': ProfileCommand,
  'p': ProfileCommand,
};
