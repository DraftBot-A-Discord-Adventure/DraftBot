/**
 * Allow the user to learn more about what is going on with his character
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ReportCommand = async function(language, message, args) {
  let player = await getRepository('player').getByMessageOrCreate(message);
  
  // TODO -- Do a blocking handler
  if (hasBlockedPlayer(message.author.id)) {
    // TODO 2.0 errorMeBlocked
    let context = getBlockedPlayer(message.author.id);
    return await message.channel.send(context);
  }

  let checkEffect = await player.checkEffect(message);
  if (checkEffect !== true) {
    return await errorMe(message, language, player);
  }
  // TODO -- END a blocking handler

  let time = millisecondsToMinutes(message.createdTimestamp - player.lastReport);
  if (time > JsonReader.commands.report.timeLimit) {
    time = JsonReader.commands.report.timeLimit;
  }

  if (player.score === 0 && player.effect === EFFECT.BABY) {
    // TODO add player to blocked
    let event = await getRepository('event').getById(0);
    return await doEvent(message, language, event, player, time);
  }

  if (time < JsonReader.commands.report.timeMinimal) {
    await getRepository('player').update(player);
    return await message.channel.send(format(JsonReader.commands.report.noReport, {pseudo: message.author.username}));
  }

  // TODO add player to blocked

  if (time <= JsonReader.commands.report.timeMaximal && Math.round(Math.random() * JsonReader.commands.report.timeMaximal) > time) {
    // TODO Exec special event nothingToSay
    return;
  }

  let event = await getRepository('event').getRandom();
  return await doEvent(message, language, event, player, time);
};

/**
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Event} event
 * @param {Player} player
 * @param {Number} time
 * @return {Promise<void>}
 */
const doEvent = async (message, language, event, player, time) => {
  const eventDisplayed = await message.channel.send(format(JsonReader.commands.report.getTranslation(language).doEvent, {pseudo: message.author.username, event: event.getTranslation(language)}));
  const collector = eventDisplayed.createReactionCollector((reaction, user) => {return (event.reactions.indexOf(reaction.emoji.name) !== -1 && user.id === message.author.id);}, {time: 120000});
  collector.on('collect', async (reaction) => {
    collector.stop();
    let possibility = await getRepository('possibility').getRandomByIdAndEmoji(event.id, reaction.emoji.name);
    await doPossibility(message, language, possibility, player, time);
  });
  collector.on('end', async () => {
    if (!collector.ended) {
      let possibility = await getRepository('possibility').getRandomByIdAndEmoji(event.id, 'end');
      await doPossibility(message, language, possibility, player, time);
    }
  });
  for (const react in event.reactions) {
    await eventDisplayed.react(event.reactions[react]);
  }
};

/**
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Possibility} possibility
 * @param {Player} player
 * @param {Number} time
 * @return {Promise<Message>}
 */
const doPossibility = async (message, language, possibility, player, time) => {
  let scoreChange = time + Math.round(Math.random() * (time / 10 + player.level));
  let moneyChange = possibility.money + Math.round(time / 10 + Math.round(Math.random() * (time / 10 + player.level / 5)));
  if (possibility.money < 0 && moneyChange > 0) {
    moneyChange = Math.round(possibility.money / 2);
  }

  let result = '';
  result += (moneyChange >= 0) ? format(JsonReader.commands.report.getTranslation(language).money, {money: moneyChange}) : result += format(JsonReader.commands.report.getTranslation(language).moneyLoose, {money: moneyChange});
  if (possibility.experience > 0) {
    result += format(JsonReader.commands.report.getTranslation(language).experience, {experience: possibility.experience});
  }
  if (possibility.health < 0) {
    result += format(JsonReader.commands.report.getTranslation(language).health, {health: possibility.health});
  }
  if (possibility.health > 0) {
    result += format(JsonReader.commands.report.getTranslation(language).healthLoose, {health: possibility.health});
  }
  // TODO Mettre le temps + le temps de l'effet
  if (possibility.lostTime > 0) {
    result += format(JsonReader.commands.report.getTranslation(language).timeLost, {timeLost: possibility.lostTime});
  }
  result = format(JsonReader.commands.report.getTranslation(language).doPossibility, {pseudo: message.author, result: result, event: possibility.getTranslation(language)});

  player.effect = possibility.effect;
  player.addScore(scoreChange);
  player.addMoney(moneyChange);
  player.addHealth(possibility.health);
  player.addExperience(possibility.experience);
  player.setLastReportWithEffect(message.createdTimestamp, possibility.lostTime, possibility.effect);

  if (possibility.item === true) {
    // TODO
    // player = await player.giveRandomItem(message, player, false);
  }

  if (possibility.eventId === 0) {
    player.money = 0;
    player.score = 0;
    if (possibility.emoji !== 'end') {
      player.money = 10;
      player.score = 100;
    }
  }

  await getRepository('player').update(player);
  await message.channel.send(result);

  // TODO remove player of blocked
  // TODO CHECK STATUS (LVL UP / SKULL)

  // return await XXX;
};

module.exports = {
  'report': ReportCommand,
  'r': ReportCommand,
};
