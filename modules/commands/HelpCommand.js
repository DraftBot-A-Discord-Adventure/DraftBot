const MessageSender = require('../MessageSender');
const Config = require('../utils/Config');
const Text = require('../text/Francais');

const helpCommand = function(message) {
    let helpMessage = generateHelpMessage();
    MessageSender.replyToMessage(message, helpMessage);
};

/**
 * Returns a string containing a list of all the known commands, as well as some extra comment.
 * @returns {string} - A string containing a list of all the known commands.
 */
const generateHelpMessage = function() {
    let helpMessage = Text.commands.help.main;
    for (const command in Config.commandNames) {
        if (Config.commandNames.hasOwnProperty(command)) {
            helpMessage = helpMessage.concat(`\n${command}`);
        }
    }
    return helpMessage;
};

module.exports.HelpCommand = helpCommand;