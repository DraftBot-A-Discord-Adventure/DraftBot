/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const TournamentCommand = async function(language, message, args) {

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.TOURNAMENT)) !== true) {
        return;
    }

    if (args.length <= 1 || (args[0] !== "channel" && args[0] !== "maxpower")) {
        sendErrorMessage(message.author, message.channel, language, JsonReader.commands.tournament.getTranslation(language).usage);
        return;
    }

    if (isNaN(args[1])) {
        sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.tournament.getTranslation(language).errorNaN, { arg: args[1] }));
        return;
    }
    if (args[0] === "channel") {
        global.tournamentChannel = args[1];
        await message.channel.send(format(JsonReader.commands.tournament.getTranslation(language).channelSet, { channel: args[1] }));
    }
    else if (args[0] === "maxpower") {
        global.tournamentPower = parseInt(args[1]);
        await message.channel.send(format(JsonReader.commands.tournament.getTranslation(language).maxPowerSet, { maxPower: args[1] }));
    }
};

module.exports = {
    commands: [
        {
            name: 'tournament',
            func: TournamentCommand
        }
    ]
};

global.tournamentChannel = "656586677841821728";
global.tournamentPower = 500;