//Discord API
const Discord = require("discord.js");
const DefaultValues = require('../../utils/DefaultValues');
const PlayerManager = require('../../classes/PlayerManager');
const GuildManager = require('../../classes/GuildManager');
const Tools = require('../../utils/Tools');

let Text
let playerManager = new PlayerManager();


/**
 * Allow to display the rankings of the players
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const guildDailyCommand = async function (message, args, client) {
    Text = await Tools.chargeText(message);
    let guildManager = new GuildManager();
    let guild = await guildManager.getCurrentGuild(message);
    if (guild === null) {
        message.channel.send(generateNotInAGuildException(user));
        return;
    }
    let members = await guildManager.getGuildMembers(guild.getGuildId());
    console.log(members)
    message.channel.send(guild.toString());
}


/**
 * @returns {String} - A RichEmbed message wich display the generateNoGuildException
 */
function generateNoGuildException() {
    let embed = generateDefaultEmbed();
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setTitle(Text.commands.guild.error);
    embed.setDescription(Text.commands.guild.notFound);
    return embed;
}

/**
 * The default embed style for the bot
 */
const generateDefaultEmbed = function () {
    return new Discord.RichEmbed().setColor(DefaultValues.embed.color);
}

module.exports.guildDailyCommand = guildDailyCommand;