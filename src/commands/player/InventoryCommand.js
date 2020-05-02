/**
 * Displays the inventory of a player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const InventoryCommand = async (language, message, args) => {

  let player;
  if (args.length === 0) {
    player = await getRepository('player').getByMessageOrCreate(message);

    if (player.effect === EFFECT.BABY) {
      return await message.channel.send(
          format(JsonReader.error.getTranslation(language).meIsBaby,
              {pseudo: player.getPseudo(language)}));
    }
  } else {
    player = await getRepository('player').getByArgs(args, message);

    if (player.effect === EFFECT.BABY) {
      return await message.channel.send(
          format(JsonReader.error.getTranslation(language).playerIsBaby, {
            pseudo: message.author.username,
            askedPseudo: player.getPseudo(language),
          }));
    }
  }

  let inventoryPlayer = await getRepository('inventory')
      .getByPlayerId(player.discordId);
  let inventoryEmbed = await inventoryPlayer.toEmbedObject(language);

  let embed = new discord.MessageEmbed().setColor(JsonReader.bot.embed.color)
      .setTitle(inventoryEmbed.title)
      .addFields(inventoryEmbed.fields);
  return await message.channel.send(embed);
};

module.exports = {
  'inventory': InventoryCommand,
  'inv': InventoryCommand,
};
