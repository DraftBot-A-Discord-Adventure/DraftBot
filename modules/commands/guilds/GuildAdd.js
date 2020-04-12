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
 * Allow to add a player into your guild
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const guildAddCommand = async function (message, args, client) {
    Text = await Tools.chargeText(message);
    let guildManager = new GuildManager();
    let playerManager = new PlayerManager();
    let serverPrefix = await chargePrefix(message);
    let host = message.author;

    if(args[1] === null || args[1]  === undefined) {
        message.channel.send(generateNoUserException(host, serverPrefix));
        return;
    }

    let user = getUserFromMention(args[1], client)

    playerManager.getPlayerById(user.id); //Add the user to the database if it is missing.

    if(user === null || user === undefined) {
        message.channel.send(generateNoUserException(host, serverPrefix));
        return;
    }

    let hostGuild = await guildManager.getCurrentGuild(message);
    let userGuild = await guildManager.getGuildByUserId(user.id);

    if(userGuild !== null) {
        message.channel.send(generateAlreadyInAGuildException(user));
        return;
    }

    if(hostGuild === null) {
        message.channel.send(generateNotInAGuildException(host));
        return;
    }

    if(hostGuild.getChief() !== host.id) {
        message.channel.send(generateNotTheGuildHostException(host));
        return;
    }

    let guildMembersNumber = await guildManager.getNumberOfMembersWithGuildId(hostGuild.guildId)

    if(guildMembersNumber >= 5) {
        message.channel.send(generateGuildFullException(host));
        return;
    }

    let messageGuild = await generateGuildAddMessage(message, user, hostGuild, serverPrefix);
    message.channel.send(user.toString() + Text.commands.guildAdd.addSentence1 + hostGuild.getName() + Text.commands.guildAdd.addSentence2, messageGuild).then(async msg => {
        await addBasicReactions(msg); //Add reactions
        const filterConfirm = (reaction, user1) => {
            return (confirmReactionIsCorrect(reaction) && user1.id === user.id);
        };
        const collector = msg.createReactionCollector(filterConfirm, {
            time: 120000
        });
        //execute this if a user answer to the event
        await createCollector(collector, message, user, hostGuild);
    });
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
 * Creating the reactions collector and possibilities
 * @param {*} collector - The collector
 */
async function createCollector(collector, message, user, guild) {
    return collector.on('collect', async (reaction) => {
        switch (reaction.emoji.name) {
            case "✅":
                await addPlayerToGuild(user, guild)
                message.channel.send(Text.commands.guildAdd.checkMark + user.toString() + Text.commands.guildAdd.gJoin + guild.name + Text.commands.guildAdd.gJoinEnd);
                break;
            case "❌":
                message.channel.send(Text.commands.guildAdd.x + user.toString() + Text.commands.guildAdd.gJoinRefuse);
                break;
        }
    });
}

async function addPlayerToGuild(user, guild) {
    let playerManager = new PlayerManager();
    let player = await playerManager.getPlayerById(user.id);
    player.setGuildId(guild.guildId);
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
const generateGuildAddMessage = async function (message, user, guild, serverPrefix) {
    const embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.guild + guild.getName());
    embed.setDescription(user.toString() + Text.commands.guildAdd.gInfos + serverPrefix + Text.commands.guildAdd.gInfos2 + guild.getName() + Text.commands.guildAdd.gInfos3);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the AlreadyInAGuildException
 * @param {*} user - The user to add in the guild
 */
const generateAlreadyInAGuildException = function(user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    embed.setDescription(Text.commands.guildAdd.PIError + user.toString() + Text.commands.guildAdd.PIError1);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} serverPrefix - The prefix of the bot on the server
 */
const generateNoUserException = function(user, serverPrefix) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    embed.setDescription(user.toString() + Text.commands.guildAdd.pingError + serverPrefix + Text.commands.guildAdd.PIError3);
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
    embed.setDescription(user.toString() + Text.commands.guildAdd.notInAGuildError);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NotChiefException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateNotTheGuildHostException = function(user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    embed.setDescription(user.toString() + Text.commands.guildAdd.notChiefError);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateGuildFullException = function(user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    embed.setDescription(user.toString() + Text.commands.guildAdd.guildFullError);
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

module.exports.guildAddCommand = guildAddCommand;