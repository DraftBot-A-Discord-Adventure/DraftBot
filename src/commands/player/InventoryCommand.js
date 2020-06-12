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
  } else {
    entity = await Entities.getByArgs(args, message);
  }

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY], entity)) !== true) {
    return;
  }

  let inventoryEmbed = await entity.Player.Inventory.toEmbedObject(language);
  return await message.channel.send(
      new discord.MessageEmbed()
          .setColor(JsonReader.bot.embed.default)
          .setTitle(format(JsonReader.commands.inventory.getTranslation(language).title, {pseudo: await entity.Player.getPseudo(language)}))
          .addFields(inventoryEmbed)
    );
};

module.exports = {
  'inventory': InventoryCommand,
  'inv': InventoryCommand,
};
