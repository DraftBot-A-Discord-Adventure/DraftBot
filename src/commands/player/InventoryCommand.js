/**
 * Displays the inventory of a player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const InventoryCommand = async (language, message, args) => {

  let entity;

  if (args.length === 0) {
    [entity] = await Entities.getOrRegister(message.author.id);

    // TODO quels sont les permissions ?
  } else {
    entity = await Entities.getByArgs(args, message);

    // TODO quels sont les permissions ?
  }

  let inventoryEmbed = entity.Player.Inventory.toEmbedObject(language);

  return await message.channel.send(
      new discord.MessageEmbed().setColor(JsonReader.bot.embed.default)
          .setTitle(inventoryEmbed.title)
          .addFields(inventoryEmbed.fields)
  );
};

module.exports = {
  'inventory': InventoryCommand,
  'inv': InventoryCommand,
};
