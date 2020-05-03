/**
 * Allow the user to learn more about what is going on with his character
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ReportCommand = async function(language, message, args) {
  let player = await getRepository('player').getByMessageOrCreate(message);

  if (hasBlockedPlayer(message.author.id)) {
    // TODO 2.0 errorMeBlocked
    let context = getBlockedPlayer(message.author.id);
    return message.channel.send(context);
  }

  let checkEffect = await player.checkEffect(message);
  if (checkEffect !== true) {
    return await errorMe(message, language, player);
  }

  // TODO add player to blocked
  // player.effect = EFFECT.CLOCK10;
  // player = await getRepository('player').update(player);

  let time = millisecondsToMinutes(message.createdTimestamp - player.lastReport);
  if (time > JsonReader.commands.report.timeLimit) {
    time = JsonReader.commands.report.timeLimit;
  }

  if (player.score === 0 && player.effect === EFFECT.BABY) {
    let event = await getRepository('event').getById(0);
    return await doEvent(message, language, event, player, time);
  }

  if (time < JsonReader.commands.report.timeMinimal) {
    player.effect = EFFECT.SMILEY;
    await getRepository('player').update(player);
    return await message.channel.send(format(JsonReader.commands.report.noReport, {pseudo: message.author.username}));
  }

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
  const eventDisplayed = await message.channel.send(format(JsonReader.commands.report.getTranslation(language).start, {pseudo: message.author.username, event: event.getTranslation(language)}));
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

  let effectChange = possibility.effect;
  let scoreChange = time + Math.round(Math.random() * (time / 10 + player.level));
  let moneyChange = Math.round(time / 10 + Math.round(Math.random() * (time / 10 + player.level / 5)));
  let healthChange = possibility.health;

  player.effect = effectChange;
  player.addScore(scoreChange);
  player.addMoney(moneyChange);
  player.setLastReportWithEffect(message.createdTimestamp, possibility.lostTime, possibility.effect);
  player.health = healthChange;
  player.experience = possibility.experience;
  if (possibility.item === true) {
    player = await player.giveRandomItem(message, player, false);
  }

  if (possibility.eventId === 0) {
    player.money = 0;
    player.experience = 0;
    if (possibility.emoji !== 'end') {
      player.score = 100;
      player.money = 10;
    }
  }

  await getRepository('player').update(player);

  await message.channel.send(possibility.getTranslation(language));
  return message.channel.send(player.toString()); // TODO
};

module.exports = {
  'report': ReportCommand,
  'r': ReportCommand,
};
