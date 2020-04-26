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
 * Allow to leave a guild
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const guildKickCommand = async function (message, args, client, talkedRecently) {
    Text = await Tools.chargeText(message);


    let serverPrefix = await chargePrefix(message);
    let user = message.author;
    let userGuild = await guildManager.getGuildByUserId(user.id);

    if (talkedRecently.has(message.author.id + "g")) {
        message.channel.send(displaySpamErrorMessage());
        return;
    }

    if (userGuild === null) {
        message.channel.send(generateNotInAGuildException(user));
        return;
    }

    if (userGuild.getChief() !== user.id) { //Player is not the guild chief
        message.channel.send(generateNotTheGuildHostException(user));
        return;
    }

    let target = getUserFromMention(message);
    if (target === null || target === undefined) {
        message.channel.send(generateNoUserException(userGuild, serverPrefix));
        return;
    }

    if (userGuild.getChief() == target.id) { //Player try to kick himself
        message.channel.send(generateTryingToKickHimselfException(user));
        return;
    }

    let targetGuild = await guildManager.getGuildByUserId(target.id);

    if (targetGuild === null) {
        message.channel.send(generateUserNotInTheGuildException(user));
        return;
    }

    if (userGuild.guildId != targetGuild.guildId) { //Player is not the guild
        message.channel.send(generateUserNotInTheGuildException(user));
        return;
    }


    confirmKick(message, user, userGuild, target, talkedRecently);
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
const confirmKick = async function (message, user, guild, target, talkedRecently) {
    talkedRecently.add(message.author.id + "g");
    let messageGuild = generateGuildKickMessage(user, guild, target);
    message.channel.send(messageGuild).then(async msg => {
        await addBasicReactions(msg); //Add reactions
        const filterConfirm = (reaction, user1) => {
            return (confirmReactionIsCorrect(reaction) && user1.id === user.id);
        };
        const collector = msg.createReactionCollector(filterConfirm, {
            time: 120000
        });
        //execute this if a user answer to the event
        await createKickCollector(collector, message, user, target, guild, talkedRecently);
    });
}

/**
 * Creating the reactions collector and possibilities
 * @param {*} collector - The collector
 */
async function createKickCollector(collector, message, user, target, guild, talkedRecently) {
    let confirmIsOpen = true
    collector.on('end', () => {
        if (confirmIsOpen) {
            talkedRecently.delete(message.author.id + "g");
            message.channel.send(Text.commands.guildAdd.x + target.toString() + Text.commands.guildKick.gKickCancelled);
        }
    });
    return collector.on('collect', async (reaction) => {
        if (confirmIsOpen) {
            confirmIsOpen = false;
            talkedRecently.delete(message.author.id + "g");
            switch (reaction.emoji.name) {
                case "✅":
                    await removePlayerFromGuild(target);
                    message.channel.send(Text.commands.guildAdd.checkMark + target.toString() + Text.commands.guildKick.gKicked + guild.getName() + Text.commands.guildKick.gKickedEnd);
                    break;
                case "❌":
                    message.channel.send(Text.commands.guildAdd.x + target.toString() + Text.commands.guildKick.gKickCancelled);
                    break;
            }
        }
    });
}

/**
 * Allow to remove a player from a guild
 * @param {*} user 
 */
async function removePlayerFromGuild(user) {
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
 * Returns a string containing the kick message.
 * @returns {String} - An embed message containing the guildAdd message.
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} client - The bot client, used to retrieve the username of the players
 */
const generateGuildKickMessage = function (user, guild, target) {
    const embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.guild + guild.getName());
    embed.setDescription(user.toString() + Text.commands.guildKick.confirmKick + target.toString() + Text.commands.guildKick.confirmKickEnd);
    return embed;
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
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateNotTheGuildHostException = function (user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(user.toString() + Text.commands.guildAdd.notChiefError);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the TryingToKickHimselfException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateTryingToKickHimselfException = function (user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(user.toString() + Text.commands.guildAdd.tryingToKickHimselfError);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateUserNotInTheGuildException = function (user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    embed.setDescription(user.toString() + Text.commands.guild.notInTheGuildError);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateNotInAGuildException = function (user) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setThumbnail(Text.commands.guildAdd.guildIcon);
    embed.setDescription(user.toString() + Text.commands.guild.notInAGuildError);
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

module.exports.guildKickCommand = guildKickCommand;