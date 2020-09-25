/**
 * Allow to use the potion if the player has one in the dedicated slot of his inventory
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
const DrinkCommand = async function (language, message) {
  const [entity] = await Entities.getOrRegister(message.author.id);
  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity)) !== true) {
    return;
  }
  if (await sendBlockedError(message.author, message.channel, language)) {
    return;
  }
  const potion = await entity.Player.Inventory.getPotion();
  const embed = new discord.MessageEmbed();


  if (potion.nature === NATURE.NONE) {
    if (potion.id !== JsonReader.models.inventories.potion_id) {
      await entity.Player.Inventory.drinkPotion();
      entity.Player.Inventory.save()
      sendErrorMessage(message.author, message.channel, language, JsonReader.commands.drink.getTranslation(language).objectDoNothingError);
    } else {
      sendErrorMessage(message.author, message.channel, language, JsonReader.commands.drink.getTranslation(language).noActiveObjectdescription);
    }
    return;
  }
  if (potion.nature === NATURE.HEALTH) {
    embed.setColor(JsonReader.bot.embed.default)
      .setAuthor(format(JsonReader.commands.drink.getTranslation(language).drinkSuccess, { pseudo: message.author.username }), message.author.displayAvatarURL())
      .setDescription(format(JsonReader.commands.drink.getTranslation(language).healthBonus, { value: potion.power }));
    entity.addHealth(potion.power);
    entity.Player.Inventory.drinkPotion();
  }
  if (potion.nature === NATURE.SPEED || potion.nature === NATURE.DEFENSE || potion.nature === NATURE.ATTACK) { // Those objects are active only during fights
    return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.drink.getTranslation(language).objectIsActiveDuringFights);
  }
  if (potion.nature === NATURE.HOSPITAL) {
    embed.setColor(JsonReader.bot.embed.default)
      .setAuthor(format(JsonReader.commands.drink.getTranslation(language).drinkSuccess, { pseudo: message.author.username }), message.author.displayAvatarURL())
      .setDescription(format(JsonReader.commands.drink.getTranslation(language).hospitalBonus, { value: potion.power }));
    await entity.Player.fastForward(potion.power);
    entity.Player.Inventory.drinkPotion();
  }
  if (potion.nature === NATURE.MONEY) {
    embed.setColor(JsonReader.bot.embed.default)
      .setAuthor(format(JsonReader.commands.drink.getTranslation(language).drinkSuccess, { pseudo: message.author.username }), message.author.displayAvatarURL())
      .setDescription(format(JsonReader.commands.drink.getTranslation(language).moneyBonus, { value: potion.power }));
    entity.Player.addMoney(potion.power);
    entity.Player.Inventory.drinkPotion();
  }

  await Promise.all([
    entity.save(),
    entity.Player.save(),
    entity.Player.Inventory.save(),
  ]);
  return await message.channel.send(embed);
};

module.exports = {
  commands: [
    {
      name: 'drink',
      func: DrinkCommand,
      aliases: ['dr', 'glouglou']
    }
  ]
};
