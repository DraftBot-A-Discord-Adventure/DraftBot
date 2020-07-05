/**
 * Allow to exchange the object that is in the player backup slot within the one that is active
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SellCommand = async (language, message, args) => {
  const [entity] = await Entities.getOrRegister(message.author.id);

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY], entity)) !== true) {
    return;
  }
  if (await sendBlockedError(message.author, message.channel, language)) {
    return;
  }

  if (!entity.Player.Inventory.hasItemToSell()) {
    await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sell.getTranslation(language).noItemToSell);
    return;
  }

  let backupItem = await entity.Player.Inventory.getBackupObject();
  const embed = new discord.MessageEmbed()
      .setColor(JsonReader.bot.embed.default)
      .setTitle(JsonReader.commands.sell.getTranslation(language).sellTitle)
      .setDescription(format(JsonReader.commands.sell.getTranslation(language).confirmSell, {
        mention: entity.getMention(),
        item: backupItem.getName(language),
        money: getItemValue(backupItem),
      }));
  const sellMessage = await message.channel.send(embed);
  let sold = false;
  addBlockedPlayer(entity.discordUser_id, 'sell');

  const filter = (reaction, user) => {
    return user.id === message.author.id;
  };

  const collector = sellMessage.createReactionCollector(filter, {time: 30000});

  collector.on('collect', async (reaction) => {
    switch (reaction.emoji.name) {
      case '✅':
        sold = true;
        backupItem = await entity.Player.Inventory.getBackupObject();
        if (entity.Player.Inventory.hasItemToSell()) { // Preventive
          const money = getItemValue(backupItem);
          entity.Player.Inventory.backup_id = JsonReader.models.inventories.backup_id;
          entity.Player.Inventory.save();
          entity.Player.money += money;
          entity.Player.save();
          await message.channel.send(
              format(JsonReader.commands.sell.getTranslation(language).soldMessage,
                  {
                    item: backupItem.getName(language),
                    money: money,
                    totalMoney: entity.Player.money,
                  },
              ));
        }
        collector.stop();
        break;
      case '❌':
        collector.stop();
        break;
      default:
        return;
    }
  });

  collector.on('end', async () => {
    removeBlockedPlayer(entity.discordUser_id);
    if (!sold) {
      await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.sell.getTranslation(language).sellCanceled);
    }
  });

  try {
    await sellMessage.react('✅');
    await sellMessage.react('❌');
  } catch (e) {
  }
};

module.exports = {
  'sell': SellCommand,
};
