/**
 * Display help for a player
 * @param {string} serverLanguage
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {[string]} args - arguments typed by the user in addition to the command
 * @return {Promise<void>}
 */
const HelpCommand = async (serverLanguage, message, args) => {
    let helpMessage = Config.text[serverLanguage].commands.help.commands[args[0]];

    if (helpMessage === undefined) {
        helpMessage = Config.text[serverLanguage].commands.help.intro + message.author.username + Config.text[serverLanguage].commands.help.main;
    }

    if (draftbot.client.guilds.cache.get(Config.MAIN_SERVER_ID).members.cache.find(val => val.id === message.author.id) === undefined) {
        await message.author.send(Config.text[serverLanguage].commands.help.mp);
    }

    message.channel.send(helpMessage);
};

module.exports.HelpCommand = HelpCommand;
