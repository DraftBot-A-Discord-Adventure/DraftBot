const ServerManager = require('../classes/ServerManager');
let Text

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Display help for a player 
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const helpCommand = async function (message, args, client) {
    Text = await chargeText(message);
    let helpMessage;
    if (userAskForGeneralHelp(args[1]))
        helpMessage = generateGeneralHelpMessage(message);
    else
        helpMessage = generateHelpMessageForSpecificCommand(message, args[1]);
    if (helpAskerIsNotInHelpGuild(client, message)) {
        message.author.send(Text.commands.help.mp)
    }

    message.channel.send(helpMessage);
};

/**
 * Returns a string containing the general help message.
 * @returns {String} - A string containing an help message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateGeneralHelpMessage = function (message) {
    let helpMessage = Text.commands.help.intro + message.author.username + Text.commands.help.main;
    return helpMessage;
};

/**
 * Returns a string containing a specific help message about one command.
 * @returns {String} - A string containing help about a command.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param commandname - The args given by the user to tell what command he need help about.
 */
const generateHelpMessageForSpecificCommand = function (message, commandname) {
    let helpMessage = Text.commands.help.commands[commandname];
    if (helpMessage === undefined)
        helpMessage = generateGeneralHelpMessage(message);
    return helpMessage;
};

/**
 * Return true if the author is not in the guild where he can recieve help
 * @param {*} client - The client of the bot
 * @param {*} message - The message that lauched the command
 */
function helpAskerIsNotInHelpGuild(client, message) {
    return client.guilds.get("429765017332613120").members.find(val => val.id === message.author.id) == undefined;
}

/**
 * Returns a boolean containing false if the user ask help for a specific command.
 * @returns {boolean} - A boolean containing false if the user ask help for a specific command.
 * @param args - arguments typed by the user in addition to the command
 */
function userAskForGeneralHelp(args) {
    return (args === undefined);
}


module.exports.HelpCommand = helpCommand;