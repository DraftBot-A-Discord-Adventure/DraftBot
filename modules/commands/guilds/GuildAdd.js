//Discord API
const Discord = require("discord.js");
const DefaultValues = require('../../utils/DefaultValues');
const PlayerManager = require('../../classes/PlayerManager');
const ServerManager = require('../../classes/ServerManager');
const GuildManager = require('../../classes/GuildManager');
const Tools = require('../../utils/Tools');

let Text;

let guildManager = new GuildManager();
let serverManager = new ServerManager();
let playerManager = new PlayerManager();

/**
 * Allow to charge the prefix of the server
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargePrefix = async function (message) {
    return await serverManager.getServerPrefix(message);
}

/**
 * Allow to add a player into your guild
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const guildAddCommand = async function (message, args, client, talkedRecently) {
    Text = await Tools.chargeText(message);

    let serverPrefix = await chargePrefix(message);
    let host = message.author;

    if (talkedRecently.has(message.author.id + "g")) {
        message.channel.send(displaySpamErrorMessage());
        return;
    }

    if (args[1] === null || args[1] === undefined) {
        message.channel.send(generateNoUserException(host, serverPrefix));
        return;
    }
    let user = getUserFromMention(message);
    if (user === null || user === undefined) {
        message.channel.send(generateNoUserException(host, serverPrefix));
        return;
    }

    let hostGuild = await guildManager.getCurrentGuild(message);
    let userGuild = await guildManager.getGuildByUserId(user.id);

    if (talkedRecently.has(user.id + "g")) {
        message.channel.send(displaySpamErrorUserOccupiedMessage());
        return;
    }

    if (userGuild !== null) {
        message.channel.send(generateAlreadyInAGuildException(user));
        return;
    }

    if (hostGuild === null) {
        message.channel.send(generateNotInAGuildException(host));
        return;
    }

    if (hostGuild.getChief() !== host.id) {
        message.channel.send(generateNotTheGuildHostException(host));
        return;
    }

    let guildMembersNumber = await guildManager.getNumberOfMembersWithGuildId(hostGuild.guildId)

    if (guildMembersNumber >= 5) {
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
        talkedRecently.add(message.author.id + "g");
        talkedRecently.add(user.id + "g");
        await createCollector(collector, message, user, hostGuild, talkedRecently);
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
async function createCollector(collector, message, user, guild, talkedRecently) {
    let confirmIsOpen = true
    collector.on('end', () => {
        if (confirmIsOpen) {
            talkedRecently.delete(message.author.id + "g");
            talkedRecently.delete(user.id + "g");
            message.channel.send(Text.commands.guildAdd.x + user.toString() + Text.commands.guildAdd.gJoinRefuse);
        }
    });
    return collector.on('collect', async (reaction) => {
        if (confirmIsOpen) {
            confirmIsOpen = false;
            talkedRecently.delete(message.author.id + "g");
            talkedRecently.delete(user.id + "g");
            switch (reaction.emoji.name) {
                case "✅":
                    await addPlayerToGuild(user, guild, message)
                    message.channel.send(Text.commands.guildAdd.checkMark + user.toString() + Text.commands.guildAdd.gJoin + guild.name + Text.commands.guildAdd.gJoinEnd);
                    break;
                case "❌":
                    message.channel.send(Text.commands.guildAdd.x + user.toString() + Text.commands.guildAdd.gJoinRefuse);
                    break;
            }
        }
    });
}

/**
 * add the player into the guild
 * @param {*} user 
 * @param {*} guild
 * @param {*} message
 */
async function addPlayerToGuild(user, guild, message) {
    let player = await playerManager.getPlayerById(user.id);
    player.setGuildId(guild.guildId);
    playerManager.updatePlayer(player);
    updateLastInvocation(guild,message);
    guildManager.updateGuild(guild);
}

/**
 * Display an error if the user is spamming the command
 */
function displaySpamErrorMessage() {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(Text.commands.guildAdd.spamError);
    return embed;
}

/**
 * Display an error if the user is spamming the command
 */
function displaySpamErrorUserOccupiedMessage() {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(Text.commands.guildAdd.spamOccupiedError);
    return embed;
}

/**
 * update the moment where the daily guild was used
 * @param {*} guild 
 * @param {*} message 
 */
function updateLastInvocation(guild, message) {
    guild.lastInvocation = message.createdTimestamp;
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
const generateAlreadyInAGuildException = function (user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(Text.commands.guildAdd.errorBegin + user.toString() + Text.commands.guildAdd.alreadyInAGuildError);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} serverPrefix - The prefix of the bot on the server
 */
const generateNoUserException = function (user, serverPrefix) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(user.toString() + Text.commands.guildAdd.pingError + serverPrefix + Text.commands.guildAdd.guildAddExemple);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} user - the user that the error refeirs to
 */
const generateNotInAGuildException = function (user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(user.toString() + Text.commands.guildAdd.notInAGuildError);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NotChiefException
 * @param {*} user - the user that the error refeirs to
 */
const generateNotTheGuildHostException = function (user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(user.toString() + Text.commands.guildAdd.notChiefError);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} user - the user that the error refeirs to
 */
const generateGuildFullException = function (user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(user.toString() + Text.commands.guildAdd.guildFullError);
    return embed;
}

/**
 * get the user from the args
 * @param {*} args 
 */
const getUserFromMention = function (message) {
    try {
        player = message.mentions.users.last();
    } catch (err) { // the input is not a mention or a user rank
        player = "0"
    }
    return player;
}

/**
 * The default embed style for the bot
 */
const generateDefaultEmbed = function () {
    return new Discord.RichEmbed().setColor(DefaultValues.embed.color);
}

module.exports.guildAddCommand = guildAddCommand;