const PlayerManager = require('../classes/PlayerManager');
const EventManager = require('../classes/EventManager');

const Text = require('../text/Francais');


/**
 * Allow the user to learn more about what is going on with his character
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const reportCommand = async function (message) {

   let eventManager = new EventManager;
   //test phase : display the event "arbre":
   let event = eventManager.loadEvent(1)
   let reponse = await displayEvent(message, event);


   //TODO
   const filter = (reaction, user) => {
      return (reactionIsCorrect(event, reaction) && user.id === message.author.id);
   };

   const collector = reponse.createReactionCollector(filter, {
      time: 120000
   });

   collector.on('collect', (reaction, reactionCollector) => {
      message.channel.send("test");
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
 * Check if the reaction recieved is corresponding to a reaction of the event
 * @param {*} event - The event that is related with the reaction
 * @param {*} reaction - The reaction recieved
 */
const reactionIsCorrect = function (event, reaction) {
   let contains = false;
   for (reac in event.emojis) {
      if (event.emojis[reac] == reaction.emoji.name)
         contains = true;
      break;
   }
   return contains
}


module.exports.ReportCommand = reportCommand;


