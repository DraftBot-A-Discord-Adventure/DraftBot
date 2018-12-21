const MessageSender = require('../MessageSender');
const Config = require('../utils/Config');
const Text = require('../text/Francais');

const helpCommand = function (message, args) {
    let helpMessage;
    if (userAskForGeneralHelp(args[1]))
        helpMessage = generateGeneralHelpMessage(message);
    else
        helpMessage = generateHelpMessageForSpecificCommand(message,args[1]);

    MessageSender.replyToMessage(message, helpMessage);
};

/**
 * Returns a string containing the general help message.
 * @returns {string} - A string containing an help message.
 * @param message - the message sent by the user that lauch the command.
 */
const generateGeneralHelpMessage = function (message) {
    let helpMessage = Text.commands.help.intro + message.author.username + Text.commands.help.main;
    return helpMessage;
};

/**
 * Returns a string containing a specific help message about one command.
 * @returns {string} - A string containing help about a command.
 * @param message - the message sent by the user that lauch the command.
 * @param commandname - the args given by the user to tell what command he need help about.
 */
const generateHelpMessageForSpecificCommand = function (message,commandname) {
    let helpMessage = Text.commands.help[commandname];
    if(helpMessage === undefined)
        helpMessage = generateGeneralHelpMessage(message);
    return helpMessage;
};

/**
 * Returns a boolean containing false if the user ask help for a specific command.
 * @returns {boolean} - A boolean containing false if the user ask help for a specific command.
 * @param args - arguments typed by the user in addition to the command
 */
function userAskForGeneralHelp(args) {
    return (args === undefined);
}


module.exports.HelpCommand = helpCommand;