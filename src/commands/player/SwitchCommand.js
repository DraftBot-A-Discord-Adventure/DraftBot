/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SwitchCommand = async (language, message, args) => {
  let player = await getRepository('player').getByMessageOrCreate(message);

  if (player.effect === EFFECT.BABY) {
    return await message.channel.send(
        format(JsonReader.error.getTranslation(language).meIsBaby,
            {pseudo: player.getPseudo(language)}));
  }

  let inventory = await getRepository('inventory')
      .getByMessageOrCreate(message);
  const temp = inventory.objectId;
  inventory.objectId = inventory.backupItemId;
  inventory.backupItemId = temp;

  await getRepository('inventory').update(inventory);
  await message.channel.send(
      format(JsonReader.commands.switch.getTranslation(language).main,
          {pseudo: player.getPseudo(language)}));
};

module.exports = {
  'switch': SwitchCommand,
};
