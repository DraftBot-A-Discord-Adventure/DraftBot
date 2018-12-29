const PlayerManager = require('../classes/PlayerManager');
const EventManager = require('../classes/EventManager');
const TypeOperators = require('../utils/TypeOperators');
const Player = require('../classes/Player');

const Text = require('../text/Francais');


/**
 * Allow the user to learn more about what is going on with his character
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const reportCommand = async function (message) {

   let eventManager = new EventManager;
   let playerManager = new PlayerManager;
   let player = new Player;
   

   //test phase : display the event "arbre":
   let event = eventManager.loadEvent(1)
   let reponse = await displayEvent(message, event);

   const filter = (reaction, user) => {
      return (reactionIsCorrect(event, reaction) && user.id === message.author.id);
   };

   const collector = reponse.createReactionCollector(filter, {
      time: 120000
   });

   collector.on('collect', (reaction, reactionCollector) => {
      let possibility = eventManager.loadPossibility(1, reaction.emoji.name, 1);
      displayPossibility(message, possibility, player);
   });

};

/**
 * display an event to the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} event - The event that has to be displayed
 */
const displayEvent = function (message, event) {
   return message.channel.send(Text.commands.report.eventStart + message.author.username + Text.events[event.id]).then(msg => {
      for (reac in event.emojis) {
         msg.react(event.emojis[reac]);
      }
      return msg;
   })
};


/**
 * display a possibility to the player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} possibility - The possibility that has to be displayed
 * @param {*} player - The player that is reacting to the event
 */
const displayPossibility = function (message, possibility, player) {
   let pointsGained = calculatePoints(player, possibility);
   let moneyChange = calculateMoney(player, possibility)
   let possibilityMessage = Text.commands.report.eventStart + message.author + Text.commands.report.points + pointsGained;
   if (TypeOperators.isAPositiveNumberOrNull(moneyChange)) {
      possibilityMessage += Text.commands.report.moneyWin + moneyChange;
   } else {
      possibilityMessage += Text.commands.report.moneyLoose + moneyChange;
   }
   if (TypeOperators.isANegativeNumber(possibility.healthPointsChange))
      possibilityMessage += Text.commands.report.healthLoose + possibility.healthPointsChange;
   if (TypeOperators.isAPositiveNumber(possibility.healthPointsChange))
      possibilityMessage += Text.commands.report.healthWin + possibility.healthPointsChange;
   
   possibilityMessage += Text.possibilities[possibility.idEvent][possibility.emoji][possibility.id]
      message.channel.send(possibilityMessage);
};


/**
 * calculate the amount of point a player will win during the event
 * @param {*} possibility - The possibility that has been chosen by the player
 * @param {*} player - The player that is reacting to the event
 */
const calculatePoints = function (player, possibility) {
   return 350;
};

/**
 * calculate the amount of money a player will or loose win during the event
 * @param {*} possibility - The possibility that has been chosen by the player
 * @param {*} player - The player that is reacting to the event
 */
const calculateMoney = function (player, possibility) {
   return 350;
};


/**
 * Check if the reaction recieved is corresponding to a reaction of the event
 * @param {*} event - The event that is related with the reaction
 * @param {*} reaction - The reaction recieved
 */
const reactionIsCorrect = function (event, reaction) {
   let contains = false;
   for (reac in event.emojis) {
      console.log(event.emojis[reac] + " / " + reaction.emoji.name)
      if (event.emojis[reac] == reaction.emoji.name)
         contains = true;
   }
   return contains
}


module.exports.ReportCommand = reportCommand;


