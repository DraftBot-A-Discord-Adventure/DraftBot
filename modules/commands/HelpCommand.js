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
 * Returns a string containing a list of all the known commands, as well as some extra comment.
 * @returns {string} - A string containing a list of all the known commands.
 */
const generateGeneralHelpMessage = function (message) {
    let helpMessage = Text.commands.help.intro + message.author.username + Text.commands.help.main;
    return helpMessage;
};

/**
 * Returns a string containing a list of all the known commands, as well as some extra comment.
 * @returns {string} - A string containing a list of all the known commands.
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
 */
function userAskForGeneralHelp(args) {
    return (args === undefined);
}


module.exports.HelpCommand = helpCommand;