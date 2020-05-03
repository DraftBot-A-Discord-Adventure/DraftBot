/**
 * Allow the user to learn more about what is going on with his character
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const ReportCommand = async function(language, message, args) {
  let player = await getRepository('player').getByMessageOrCreate(
      message);

  // If player has a running Command that he need to terminate before
  if (hasBlockedPlayer(message.author.id)) {
    // TODO 2.0 Get text translationByContext
    let context = getBlockedPlayer(message.author.id);
    return message.channel.send(context);
  }

  // let resultMessage = this.get('effect') +
  //     Config.text[language].playerManager.intro + this.get('pseudo') +
  //     Config.text[language].playerManager.errorMain[this.get('effect')] +
  //     this.getTimeLeft(language, message);
  //
  // await message.channel.send(resultMessage);

  // If player can use this command, because the player can be sick or dead
  if (await player.checkEffect(language, message)) {
    player.effect = EFFECT.CLOCK10;
    player = await getRepository('player').update(player);

    // Fire special beginning adventure event
    if (player.get('score') === 0) {
      let event = await draftbot.getRepository('event').getById(0);
      let eventDisplayed = await message.channel.send(
          Config.text[language].commands.report.reportStart + player.get('pseudo') + event.getTranslation(language))
          .then(async msg => {
            let emojis = event.get('emojis');
            for (let react in emojis) {
              if (emojis.hasOwnProperty(react)) {
                await msg.react(emojis[react]);
              }
            }
            return msg;
          });

      // TODO Continue refactor
      console.log(eventDisplayed);
      return;
    }

    let time = Math.floor((message.createdTimestamp - player.get('lastReport')) / (1000 * 60));
    if (time > parseInt(Config.report.timeLimit)) {
      time = parseInt(Config.report.timeLimit);
    }

    if (time < Config.report.minimalTime) {
      await message.channel.send(Config.text[language].commands.report.reportStart + player.get('pseudo') + Config.text[language].commands.report.noReport);
      player.set('effect', ':smiley:');
      await draftbot.getRepository('player').update(player);
      return;
    }

    let pointsGained = time + Math.round(Math.random() * (time / 10 + player.get('level')));
    let moneyGained = Math.round(time / 10 + Math.round(Math.random() * (time / 10 + player.get('level') / 5)));

    if (time <= parseInt(Config.report.maximalTime) && Math.round(Math.random() * parseInt(Config.report.maximalTime)) > time) {
      let possibility = await draftbot.getRepository('possibility').getRandomByIdAndEmoji('report', 'nothingToSay');

      console.log(possibility);

      // execPossibility(message, possibility, playerManager, player, moneyChange, pointsGained, language, Text);
      return;
    }

    let event = await draftbot.getRepository('event').getRandom();

    await message.channel.send('YES');
  }
};

/**
 * Execute a possibility to the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} possibility - The possibility that has to be executed
 */
const execPossibility = function(
    message, possibility, playerManager, player, moneyChange, pointsGained,
    language, Text) {
  moneyChange = calculateMoneychange(moneyChange, possibility);
  let possibilityMessage;
  if (possibility.idEvent == 0) {
    if (possibility.emoji == 'end') {
      possibilityMessage = displayPossibility(message, 0, 0, possibility, Text);
      applyPossibility(message, pointsGained, moneyChange, possibility, player,
          playerManager, language, Text);
    } else {
      possibilityMessage = displayPossibility(message, pointsGained,
          moneyChange, possibility, Text);
      launchAdventure(message, pointsGained, moneyChange, player, possibility,
          playerManager, language, Text);
    }
  } else {
    possibilityMessage = displayPossibility(message, pointsGained, moneyChange,
        possibility, Text);
    applyPossibility(message, pointsGained, moneyChange, possibility, player,
        playerManager, language, Text);
  }
  possibilityMessage += Text.possibilities[possibility.idEvent][possibility.emoji][possibility.id];
  message.channel.send(possibilityMessage);
};

/**
 * Check if the reaction recieved is corresponding to a reaction of the event
 * @param {*} event - The event that is related with the reaction
 * @param {*} reaction - The reaction recieved
 * @returns {Boolean} - true is the reaction is correct
 */
const reactionIsCorrect = function(event, reaction) {
  let contains = false;
  for (reac in event.emojis) {
    if (event.emojis[reac] == reaction.emoji.name)
      contains = true;
  }
  return contains;
};

/**
 * Calculate the money change
 * @param {*} moneyChange
 * @param {*} possibility
 */
function calculateMoneychange(moneyChange, possibility) {
  moneyChange = moneyChange + parseInt(possibility.moneyGained);
  if (parseInt(possibility.moneyGained) < 0 && moneyChange > 0) {
    moneyChange = Math.round(possibility.moneyGained / 2);
  }
  return moneyChange;
}

/**
 * Allow to perform an event to a player
 * @param {*} message - The message that cause the event do be generated
 * @param {*} eventManager - The class that manage the event
 * @param {*} eventNumber  - The id of the event the player falls on
 */
async function generateEvent(
    message, eventManager, eventNumber, playerManager, player, moneyChange,
    pointsGained, language, Text) {

  console.log('Event généré numéro : ' + eventNumber);
  //load the event to display
  let event = eventManager.loadEvent(eventNumber);
  //display a message containing informations about the event and get this message back
  let reponse = await displayEvent(message, event, Text);
  let eventIsOpen = true;

  const filter = (reaction, user) => {
    return (reactionIsCorrect(event, reaction) && user.id ===
        message.author.id);
  };
  const collector = reponse.createReactionCollector(filter, {
    time: 120000,
  });
  //execute this if a user answer to the event
  collector.on('collect', (reaction) => {

    if (eventIsOpen) {
      let possibilityNumber = eventManager.chooseARandomPossibility(eventNumber,
          reaction.emoji.name);
      let possibility = eventManager.loadPossibility(eventNumber,
          reaction.emoji.name, possibilityNumber);
      execPossibility(message, possibility, playerManager, player, moneyChange,
          pointsGained, language, Text);
      eventIsOpen = false;
    }
  });
  //end of the time the user have to answer to the event
  collector.on('end', () => {
    if (eventIsOpen) {
      let possibilityNumber = eventManager.chooseARandomPossibility(eventNumber,
          'end');
      let possibility = eventManager.loadPossibility(eventNumber, 'end',
          possibilityNumber);
      execPossibility(message, possibility, playerManager, player, moneyChange,
          pointsGained, language, Text);
    }
  });
}

/**
 * display a possibility to the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} possibility - The possibility that has to be displayed
 * @param {Number} pointsGained - The amount of points the user gained during this event
 * @param {Number} moneyChange - The amount of money los or gained by the player during this event
 * @returns {String} - The message that has to be sent
 */
function displayPossibility(
    message, pointsGained, moneyChange, possibility, Text) {
  let possibilityMessage = Text.commands.report.reportStart + message.author +
      Text.commands.report.points + pointsGained;
  if (moneyChange >= 0) {
    possibilityMessage += Text.commands.report.moneyWin + moneyChange;
  } else {
    possibilityMessage += Text.commands.report.moneyLoose + -moneyChange;
  }
  if (possibility.xpGained > 0)
    possibilityMessage += Text.commands.report.xpWin + possibility.xpGained;
  if (possibility.healthPointsChange < 0)
    possibilityMessage += Text.commands.report.healthLoose +
        -possibility.healthPointsChange;
  if (possibility.healthPointsChange > 0)
    possibilityMessage += Text.commands.report.healthWin +
        possibility.healthPointsChange;
  if (possibility.timeLost > 0)
    possibilityMessage += Text.commands.report.timeLost +
        Tools.displayDuration(possibility.timeLost);
  return possibilityMessage;
}

/**
 * save the effect of a possibility on a player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} possibility - The possibility that has been selected
 * @param {*} player - The player that is reacting to the event
 * @param {Number} pointsGained - The amount of points the user gained during this event
 * @param {Number} moneyChange - The amount of money los or gained by the player during this event
 * @param {*} playerManager - The player manager
 */
async function applyPossibility(
    message, pointsGained, moneyChange, possibility, player, playerManager,
    language, Text) {

  //adding score
  player.addScore(pointsGained);

  player.addMoney(moneyChange);
  // if the number is below 0, remove money will be called by the add money method

  //the last time the player has been saw is now
  player.updateLastReport(message.createdTimestamp, possibility.timeLost,
      possibility.newEffect);

  player.setEffect(possibility.newEffect);

  player.addHealthPoints(possibility.healthPointsChange, message, language,
      Text);
  // if the number is below 0, remove health Points will be called by the add Health Points method

  player.addExperience(possibility.xpGained, message, language, Text);

  if (possibility.item == 'true') { //have to give an item to the player
    player = await playerManager.giveRandomItem(message, player, false);
  }
  playerManager.updatePlayer(player);
}

/**
 * Create a new player in the database
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} player - The player that is reacting to the event
 * @param {Number} pointsGained - The amount of points the user gained during this event
 * @param {Number} moneyChange - The amount of money los or gained by the player during this event
 * @param {*} possibility - The possibility that has been selected
 * @param {*} playerManager - The player manager
 */
function launchAdventure(
    message, pointsGained, moneyChange, player, possibility, playerManager) {

  //adding score
  player.addScore(pointsGained);

  player.addMoney(moneyChange);
  // if the number is below 0, remove money will be called by the add money method

  //the last time the player has been saw is long time ago so that the adventure is fun for the begining
  player.updateLastReport(message.createdTimestamp - 100000000,
      possibility.timeLost, possibility.newEffect);

  player.setEffect(possibility.newEffect);

  playerManager.updatePlayer(player);
}

module.exports = {
  'report': ReportCommand,
  'r': ReportCommand,
};
