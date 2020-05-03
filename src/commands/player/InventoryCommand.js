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

    let checkEffect = await player.checkEffect(message);
    if (checkEffect !== true) {
      return await errorMe(message, language, player);
    }
  } else {
    player = await getRepository('player').getByArgs(args, message);

    let checkEffect = await player.checkEffect(message);
    if (checkEffect !== true) {
      return await errorPlayer(message, language, player);
    }
  }

  let inventoryPlayer = await getRepository('inventory')
      .getByPlayerIdOrCreate(player.discordId);
  let inventoryEmbed = await inventoryPlayer.toEmbedObject(language);

  return await message.channel.send(
      new discord.MessageEmbed().setColor(JsonReader.bot.embed.default)
          .setTitle(inventoryEmbed.title)
          .addFields(inventoryEmbed.fields));
};

module.exports = {
  'inventory': InventoryCommand,
  'inv': InventoryCommand,
};
