/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
const DailyCommand = async function (language, message) {
  let [entity] = await Entities.getOrRegister(message.author.id);
  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY], entity)) !== true) {
    return;
  }
  let moment =require('moment');
  let currentDay = new moment().add(JsonReader.commands.daily.numberOfDayToReload, 'd');
  let activeObject = await entity.Player.Inventory.getActiveObject();

  let lastDailyDay = await entity.Player.Inventory.lastDailyAt;


  let embed = new discord.MessageEmbed();
  if (lastDailyDay < currentDay) {
    embed.setColor(JsonReader.bot.embed.error)
      .setAuthor(format(JsonReader.commands.daily.getTranslation(language).noDailyError, { pseudo: message.author.username }), message.author.displayAvatarURL())
      .setDescription(JsonReader.commands.daily.getTranslation(language).alreadyClaimedError);
    return await message.channel.send(embed);
  }


  if (activeObject.nature == NATURE.NONE) {
    if (activeObject.id != JsonReader.models.inventories.object_id) {
      //there is a object that do nothing in the inventory
      embed.setColor(JsonReader.bot.embed.error)
        .setAuthor(format(JsonReader.commands.daily.getTranslation(language).noDailyError, { pseudo: message.author.username }), message.author.displayAvatarURL())
        .setDescription(JsonReader.commands.daily.getTranslation(language).objectDoNothingError);
    } else {
      //there is no object in the inventory
      embed.setColor(JsonReader.bot.embed.error)
        .setAuthor(format(JsonReader.commands.daily.getTranslation(language).noDailyError, { pseudo: message.author.username }), message.author.displayAvatarURL())
        .setDescription(JsonReader.commands.daily.getTranslation(language).noActiveObjectdescription);
    }
  }
  if (activeObject.nature == NATURE.HEALTH) {
    embed.setColor(JsonReader.bot.embed.default)
      .setAuthor(format(JsonReader.commands.daily.getTranslation(language).dailySuccess, { pseudo: message.author.username }), message.author.displayAvatarURL())
      .setDescription(format(JsonReader.commands.daily.getTranslation(language).healthDaily, { value: activeObject.power }));
    entity.addHealth(activeObject.power);
    entity.Player.Inventory.updateLastDailyAt();
  }
  if (activeObject.nature == NATURE.SPEED || activeObject.nature == NATURE.DEFENSE || activeObject.nature == NATURE.ATTACK) { //Those objects are active only during fights
    embed.setColor(JsonReader.bot.embed.error)
      .setAuthor(format(JsonReader.commands.daily.getTranslation(language).noDailyError, { pseudo: message.author.username }), message.author.displayAvatarURL())
      .setDescription(JsonReader.commands.daily.getTranslation(language).objectIsActiveDuringFights);
  }
  if (activeObject.nature == NATURE.HOSPITAL) {
    embed.setColor(JsonReader.bot.embed.default)
      .setAuthor(format(JsonReader.commands.daily.getTranslation(language).dailySuccess, { pseudo: message.author.username }), message.author.displayAvatarURL())
      .setDescription(format(JsonReader.commands.daily.getTranslation(language).hospitalBonus, { value: activeObject.power }));
    entity.Player.fastForward(activeObject.power);
    entity.Player.Inventory.updateLastDailyAt();
  }
  if (activeObject.nature == NATURE.MONEY) {
    embed.setColor(JsonReader.bot.embed.default)
      .setAuthor(format(JsonReader.commands.daily.getTranslation(language).dailySuccess, { pseudo: message.author.username }), message.author.displayAvatarURL())
      .setDescription(format(JsonReader.commands.daily.getTranslation(language).moneyBonus, { value: activeObject.power }));
    entity.Player.addMoney(activeObject.power);
    entity.Player.Inventory.updateLastDailyAt();
  }

  await Promise.all([
    entity.save(),
    entity.Player.save(),
    entity.Player.Inventory.save()
  ]);
  return await message.channel.send(embed);
};


module.exports = {
  daily: DailyCommand,
  da: DailyCommand,
};
