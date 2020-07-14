/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SwitchCommand = async (language, message, args) => {
  const [entity] = await Entities.getOrRegister(message.author.id);

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity)) !== true) {
    return;
  }

  const temp = entity.Player.Inventory.object_id;
  entity.Player.Inventory.object_id = entity.Player.Inventory.backup_id;
  entity.Player.Inventory.backup_id = temp;

  await entity.Player.Inventory.save();

  await message.channel.send(format(JsonReader.commands.switch.getTranslation(language).main, {pseudo: message.author.username}));
};

module.exports = {
  'switch': SwitchCommand,
  'sw': SwitchCommand
};
