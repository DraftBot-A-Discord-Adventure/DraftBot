/**
 * Display help for a player
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param prefix
 * @param client
 * @param args - arguments typed by the user in addition to the command
 * @param serverLanguage
 * @return {Promise<void>}
 */
const HelpCommand = async (message, prefix, client, args, serverLanguage) => {
    let helpMessage;

    if (args[0] === undefined) {
        helpMessage = getGeneralHelpMessage(message, serverLanguage);
    } else {
        helpMessage = getHelpMessageForSpecificCommand(message, serverLanguage, args[0]);
    }

    if (client.guilds.cache.get(Config.MAIN_SERVER_ID).members.cache.find(val => val.id === message.author.id) === undefined) {
        await message.author.send(Config.text[serverLanguage].commands.help.mp);
    }

    message.channel.send(helpMessage);
};

/**
 * Returns a string containing the general help message.
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {string} serverLanguage
 * @returns {string} - A string containing an help message.
 */
const getGeneralHelpMessage = (message, serverLanguage) => {
    return Config.text[serverLanguage].commands.help.intro + message.author.username + Config.text[serverLanguage].commands.help.main;
};

/**
 * Returns a string containing a specific help message about one command.
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {string} serverLanguage
 * @param {string} arg - The args given by the user to tell what command he need help about.
 * @return {string} - A string containing help about a command.
 */
const getHelpMessageForSpecificCommand = (message, serverLanguage, arg) => {
    let helpMessage = Config.text[serverLanguage].commands.help.commands[arg];

    if (helpMessage === undefined) {
        return getGeneralHelpMessage(message, serverLanguage);
    }

    return helpMessage;
};

module.exports.HelpCommand = HelpCommand;
