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

    if (args[0] !== undefined) {
        helpMessage = Config.text[serverLanguage].commands.help.commands[args[0]];
    }

    if (helpMessage === undefined) {
        helpMessage = Config.text[serverLanguage].commands.help.intro + message.author.username + Config.text[serverLanguage].commands.help.main;
    }

    if (client.guilds.cache.get(Config.MAIN_SERVER_ID).members.cache.find(val => val.id === message.author.id) === undefined) {
        await message.author.send(Config.text[serverLanguage].commands.help.mp);
    }

    message.channel.send(helpMessage);
};

module.exports.HelpCommand = HelpCommand;
