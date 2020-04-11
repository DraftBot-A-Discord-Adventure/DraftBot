//Discord API
const Discord = require("discord.js");
const DefaultValues = require('../../utils/DefaultValues');
const PlayerManager = require('../../classes/PlayerManager');
const ServerManager = require('../../classes/ServerManager');
const GuildManager = require('../../classes/GuildManager');
const Tools = require('../../utils/Tools');

let Text

/**
 * Allow to charge the prefix of the server
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargePrefix = async function (message) {
    let serverManager = new ServerManager();
    return await serverManager.getServerPrefix(message);
}

/**
 * Allow to leave a guild
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const guildLeaveCommand = async function (message, args, client) {
    Text = await Tools.chargeText(message);
    let guildManager = new GuildManager();
    let serverPrefix = await chargePrefix(message);
    let user = message.author;
    let userGuild = await guildManager.getGuildByUserId(user.id);

    if(userGuild === null) { //Player is not in any guild
        message.channel.send(generateNotInAGuildException(user));
        return;
    }

    if(userGuild.getChief() !== user.id) { //Player is the guild chief
        message.channel.send(generateNotTheGuildHostException(user));
        return;
    }

    let user = getUserFromMention(args[1], client)
    playerManager.getPlayerById(user.id); //Add the user to the database if it is missing.
    if(user === null || user === undefined) {
        message.channel.send(generateNoUserException(userGuild, serverPrefix));
        return;
    }

    confirmKick(message, message.author, userGuild, user);

}

/**
* Check if the reaction recieved is valid
* @param {*} reaction - The reaction recieved
* @returns {Boolean} - true is the reaction is correct
*/
const confirmReactionIsCorrect = function (reaction) {
    let contains = false;
    if (reaction.emoji.name == "✅" || reaction.emoji.name == "❌") {
        contains = true;
    }
    return contains
}

/**
* Display a confirm message
*/
const confirmKick = async function (message, user, guild, target) {
    let messageGuild = generateGuildKickMessage(message, user, guild);
    message.channel.send(messageGuild).then(async msg => {
        await addBasicReactions(msg); //Add reactions
        const filterConfirm = (reaction, user1) => {
            return (confirmReactionIsCorrect(reaction) && user1.id === user.id);
        };
        const collector = msg.createReactionCollector(filterConfirm, {
            time: 120000
        });
        //execute this if a user answer to the event
        await createKickCollector(collector, message, user, guild);
    });
}

/**
 * Creating the reactions collector and possibilities
 * @param {*} collector - The collector
 */
async function createKickCollector(collector, message, user, guild) {
    return collector.on('collect', async (reaction) => {
        switch (reaction.emoji.name) {
            case "✅":
                await removePlayerFromGuild(guild);
                message.channel.send(Text.commands.guildAdd.checkMark + user.toString() + Text.commands.guildLeave.gLeave + guild.name + Text.commands.guildLeave.gLeaveEnd);
                break;
            case "❌":
                message.channel.send(Text.commands.guildAdd.x + user.toString() + Text.commands.guildLeave.gLeaveRefuse);
                break;
        }
    });
}

async function removePlayerFromGuild(user, guild) {
    let playerManager = new PlayerManager();
    let player = await playerManager.getPlayerById(user.id);
    player.setGuildId("0");
    playerManager.updatePlayer(player);
}

/**
 * Add true or false reaction to the message
 * @param {*} message - The message where reactions will be added
 */
async function addBasicReactions(message) {
    await message.react("✅")
    await message.react("❌");
}

/**
 * /**
 * Returns a string containing the nodrink message.
 * @returns {String} - An embed message containing the guildAdd message.
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} client - The bot client, used to retrieve the username of the players
 */
const generateGuildDestroyMessage = function (message, user, guild) {
    const embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.guild + guild.getName());
    embed.setDescription(user.toString() + Text.commands.guildLeave.confirmDestroy + guild.getName() + Text.commands.guildLeave.confirmDestroyEnd);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateNotTheGuildHostException = function(user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    embed.setDescription(user.toString() + Text.commands.guildAdd.PIError5);
    return embed;
}

/**
 * /**
 * Returns a string containing the nodrink message.
 * @returns {String} - An embed message containing the guildAdd message.
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateGuildLeaveMessage = async function (message, user, guild) {
    const embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.guild + guild.getName());
    embed.setDescription(user.toString() + Text.commands.guildLeave.confirmLeave + guild.getName() + Text.commands.guildLeave.confirmLeaveEnd);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateNotInAGuildException = function(user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    embed.setDescription(user.toString() + Text.commands.guildLeave.PIError1);
    return embed;
}

const getUserFromMention = function(mention, client) {
	// The id is the first and only match found by the RegEx.
	const matches = mention.match(/^<@!?(\d+)>$/);

	// If supplied variable was not a mention, matches will be null instead of an array.
	if (!matches) return;

	// However the first element in the matches array will be the entire mention, not just the ID,
	// so use index 1.
	const id = matches[1];

	return client.users.get(id);
}

/**
 * The default embed style for the bot
 */
const generateDefaultEmbed = function () {
    return new Discord.RichEmbed().setColor(DefaultValues.embed.color);
}

module.exports.guildLeaveCommand = guildLeaveCommand;