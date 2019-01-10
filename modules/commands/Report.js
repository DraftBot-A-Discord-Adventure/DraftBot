const PlayerManager = require('../classes/PlayerManager');
const EventManager = require('../classes/EventManager');
const TypeOperators = require('../utils/TypeOperators');
const DefaultValues = require('../utils/DefaultValues')
const Player = require('../classes/Player');

const Text = require('../text/Francais');


/**
 * Allow the user to learn more about what is going on with his character
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const reportCommand = async function (message) {

   let playerManager = new PlayerManager;
   let player = await playerManager.getCurrentPlayer(message);
   //loading of the current player

   let pointsGained = calculatePoints(player);
   let moneyChange = calculateMoney(player);


   let eventManager = new EventManager;
   let eventNumber = eventManager.chooseARandomEvent();
   // let eventNumber = 11; //allow to select a specific event in testing purpose

   let temps = player.calcTemps(message.createdTimestamp);

   if (temps > DefaultValues.report.timeLimit) {
      temps = DefaultValues.report.timeLimit;
   }

   switch (true) {

      case temps < DefaultValues.report.minimalTime:
         displayErrorReport(message);
         break;

      case temps <= DefaultValues.report.maximalTime && Math.round(Math.random() * DefaultValues.report.maximalTime) > temps:
         let possibility = loadNothingToSayPossibility(eventManager);
         execPossibility(message, possibility, playerManager, player, moneyChange, pointsGained);
         break;

      default:
         generateEvent(message, eventManager, eventNumber, playerManager, player, moneyChange, pointsGained);
   }

};


/**
 * display an event to the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} event - The event that has to be displayed
 */
const displayEvent = function (message, event) {
   return message.channel.send(Text.commands.report.reportStart + message.author.username + Text.events[event.id]).then(msg => {
      for (reac in event.emojis) {
         msg.react(event.emojis[reac]);
      }
      return msg;
   })
};

/**
 * execute a possibility to the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} possibility - The possibility that has to be executed
 */
const execPossibility = function (message, possibility, playerManager, player, moneyChange, pointsGained) {

   let possibilityMessage = displayPossibility(message, pointsGained, moneyChange, possibility);
   applyPossibility(message, pointsGained, moneyChange, possibility, player, playerManager)
   possibilityMessage += Text.possibilities[possibility.idEvent][possibility.emoji][possibility.id]
   message.channel.send(possibilityMessage);
};


/**
 * calculate the amount of point a player will win during the event
 * @param {*} player - The player that is reacting to the event
 */
const calculatePoints = function (player) {
   return 350;
};

/**
 * calculate the amount of money a player will or loose win during the event
 * @param {*} player - The player that is reacting to the event
 */
const calculateMoney = function (player) {
   return 350;
};

/**
 * return a string containing a proper display of a duration
 * @param {Number} minutes - The number of minutes to display
 * @returns {String} - The  string to display
 */
const afficherTemps = function (minutes) {
   let heures = 0;
   let display = "";
   while (minutes >= 60) {
      heures++;
      minutes -= 60;
   }
   if (TypeOperators.isAPositiveNumber(heures))
      display += heures + " H ";
   display += minutes + " Min";
   return display
};


/**
 * Check if the reaction recieved is corresponding to a reaction of the event
 * @param {*} event - The event that is related with the reaction
 * @param {*} reaction - The reaction recieved
 */
const reactionIsCorrect = function (event, reaction) {
   let contains = false;
   for (reac in event.emojis) {
      if (event.emojis[reac] == reaction.emoji.name)
         contains = true;
   }
   return contains
}
/**
 * allow to load the possibility to display if nothing happend since the previous report
 * @param {*} eventManager - The event manager class
 */
function loadNothingToSayPossibility(eventManager) {
   let possibilityNumber = eventManager.chooseARandomPossibility("report", "nothingToSay");
   return eventManager.loadPossibility("report", "nothingToSay", possibilityNumber);
}

/**
 * Allow to perform an event to a player
 * @param {*} message - The message that cause the event do be generated
 * @param {*} eventManager - The class that manage the event
 * @param {*} eventNumber  - The id of the event the player falls on
 */
async function generateEvent(message, eventManager, eventNumber, playerManager, player, moneyChange, pointsGained) {

   //load the event to display
   let event = eventManager.loadEvent(eventNumber);
   //display a message containing informations about the event and get this message back
   let reponse = await displayEvent(message, event);
   let eventIsOpen = true;

   const filter = (reaction, user) => {
      return (reactionIsCorrect(event, reaction) && user.id === message.author.id);
   };
   const collector = reponse.createReactionCollector(filter, {
      time: 120000
   });
   //todo if a user answer to the event
   collector.on('collect', (reaction) => {
      if (eventIsOpen) {
         let possibilityNumber = eventManager.chooseARandomPossibility(eventNumber, reaction.emoji.name);
         let possibility = eventManager.loadPossibility(eventNumber, reaction.emoji.name, possibilityNumber);
         execPossibility(message, possibility, playerManager, player, moneyChange, pointsGained);
         eventIsOpen = false;
      }
   });
   //end of the time the user have to answer to the event
   collector.on('end', () => {
      if (eventIsOpen) {
         let possibilityNumber = eventManager.chooseARandomPossibility(eventNumber, "end");
         let possibility = eventManager.loadPossibility(eventNumber, "end", possibilityNumber);
         execPossibility(message, possibility, playerManager, player, moneyChange, pointsGained);
      }
   });
}

/**
 * display a possibility to the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} possibility - The possibility that has to be displayed
 * @param {Integer} pointsGained - The amount of points the user gained during this event
 * @param {Integer} moneyChange - The amount of money los or gained by the player during this event
 */
function displayPossibility(message, pointsGained, moneyChange, possibility) {
   let possibilityMessage = Text.commands.report.reportStart + message.author + Text.commands.report.points + pointsGained;
   if (TypeOperators.isAPositiveNumberOrNull(moneyChange)) {
      possibilityMessage += Text.commands.report.moneyWin + moneyChange;
   }
   else {
      possibilityMessage += Text.commands.report.moneyLoose + moneyChange;
   }
   if (TypeOperators.isANegativeNumber(possibility.healthPointsChange))
      possibilityMessage += Text.commands.report.healthLoose + -possibility.healthPointsChange;
   if (TypeOperators.isAPositiveNumber(possibility.healthPointsChange))
      possibilityMessage += Text.commands.report.healthWin + possibility.healthPointsChange;
   if (TypeOperators.isAPositiveNumber(possibility.timeLost))
      possibilityMessage += Text.commands.report.timeLost + afficherTemps(possibility.timeLost);
   return possibilityMessage;
}

/**
 * display a possibility to the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} possibility - The possibility that has to be displayed
 * @param {*} player - The player that is reacting to the event
 * @param {Integer} pointsGained - The amount of points the user gained during this event
 * @param {Integer} moneyChange - The amount of money los or gained by the player during this event
 * @param {*} playerManager - The player manager
 */
function applyPossibility(message, pointsGained, moneyChange, possibility, player, playerManager) {


   //adding score
   player.addScore(pointsGained);

   player.addMoney(moneyChange);
   // if the number is below 0, remove money will be called by the add money method

   //the last time the player has been saw is now
   player.updateLastReport(message.createdTimestamp);

   player.addHealthPoints(parseInt(possibility.healthPointsChange));
   // if the number is below 0, remove health Points will be called by the add Health Points method
   // we have to parse int this because elsewhere it is considered as a screen and it do 2 + 2 = 22


   playerManager.updatePlayer(player);
}

/**
 * display an error to the user if he has not waiting more that 1 hour
 * @param {*} message - The message that cause the command to be called
 */
function displayErrorReport(message) {
   message.channel.send(Text.commands.report.reportStart + message.author.username + Text.commands.report.noReport);
}


module.exports.ReportCommand = reportCommand;