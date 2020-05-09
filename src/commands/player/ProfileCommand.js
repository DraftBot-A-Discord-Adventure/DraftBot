/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ProfileCommand = async function(language, message, args) {
  let entity;
  if (args.length === 0) {
    [entity] = await Entities.getOrRegister(message.author.id);
  } else {
    entity = await Entities.getByArgs(args, message);
  }

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY], entity)) !== true) {
    return;
  }

  let profileEmbed = await entity.Player.toEmbedObject(language, message);
  return await message.channel.send(
      new discord.MessageEmbed()
          .setColor(JsonReader.bot.embed.default)
          .setTitle(profileEmbed.title)
          .addFields(profileEmbed.fields),
    ).then(async msg => {
      if (entity.Player.badges !== null) {
        let badges = entity.Player.badges.split('-');
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
