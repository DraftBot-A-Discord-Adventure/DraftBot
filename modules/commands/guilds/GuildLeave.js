//Discord API
const Discord = require("discord.js");
const DefaultValues = require('../../utils/DefaultValues');
const PlayerManager = require('../../classes/PlayerManager');
const ServerManager = require('../../classes/ServerManager');
const GuildManager = require('../../classes/GuildManager');
const Tools = require('../../utils/Tools');

let Text;

let guildManager = new GuildManager();
let playerManager = new PlayerManager();

/**
 * Allow to leave a guild
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const guildLeaveCommand = async function (message, args, client, talkedRecently) {
    Text = await Tools.chargeText(message);
    let user = message.author;
    let userGuild = await guildManager.getGuildByUserId(user.id);

    if (talkedRecently.has(message.author.id + "g")) {
        message.channel.send(displaySpamErrorMessage());
        return;
    }

    if(userGuild === null) { //Player is not in any guild
        message.channel.send(generateNotInAGuildException(user));
        return;
    }

    talkedRecently.add(message.author.id + "g");

    if(userGuild.getChief() === user.id) { //Player is the guild chief
        await confirmGuildDestroy(message, user, userGuild, talkedRecently);
        return;
    }

    let messageGuild = await generateGuildLeaveMessage(message, user, userGuild);
    message.channel.send(messageGuild).then(async msg => {
        await addBasicReactions(msg); //Add reactions
        const filterConfirm = (reaction, user1) => {
            return (confirmReactionIsCorrect(reaction) && user1.id === user.id);
        };
        const collector = msg.createReactionCollector(filterConfirm, {
            time: 120000
        });
        //execute this if a user answer to the event
        await createLeaveCollector(collector, message, user, userGuild, talkedRecently);
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
* Display a confirm message
*/
const confirmGuildDestroy = async function (message, user, guild, talkedRecently) {
    let messageGuild = generateGuildDestroyMessage(message, user, guild);
    message.channel.send(messageGuild).then(async msg => {
        await addBasicReactions(msg); //Add reactions
        const filterConfirm = (reaction, user1) => {
            return (confirmReactionIsCorrect(reaction) && user1.id === user.id);
        };
        const collector = msg.createReactionCollector(filterConfirm, {
            time: 120000
        });
        //execute this if a user answer to the event
        await createDestroyCollector(collector, message, user, guild, talkedRecently);
    });
}

/**
 * Creating the reactions collector and possibilities
 * @param {*} collector - The collector
 */
async function createDestroyCollector(collector, message, user, guild, talkedRecently) {
    let confirmIsOpen = true;
    collector.on('end', () => {
        if (confirmIsOpen) {
            talkedRecently.delete(user.id + "g");
            message.channel.send(Text.commands.guildAdd.x + user.toString() + Text.commands.guildLeave.gLeaveRefuse);
        }
    });
    return collector.on('collect', async (reaction) => {
        if (confirmIsOpen) {
            confirmIsOpen = false;
            talkedRecently.delete(user.id + "g");
            switch (reaction.emoji.name) {
                case "✅":
                    await destroyGuild(guild);
                    message.channel.send(Text.commands.guildAdd.checkMark + user.toString() + Text.commands.guildLeave.gLeave + guild.name + Text.commands.guildLeave.gLeaveEnd);
                    break;
                case "❌":
                    message.channel.send(Text.commands.guildAdd.x + user.toString() + Text.commands.guildLeave.gLeaveRefuse);
                    break;
            }
        }
    });
}

/**
 * Creating the reactions collector and possibilities
 * @param {*} collector - The collector
 */
async function createLeaveCollector(collector, message, user, guild, talkedRecently) {
    let confirmIsOpen = true;
    collector.on('end', () => {
        if (confirmIsOpen) {
            talkedRecently.delete(user.id + "g");
            message.channel.send(Text.commands.guildAdd.x + user.toString() + Text.commands.guildLeave.gLeaveRefuse);
        }
    });
    return collector.on('collect', async (reaction) => {
        if (confirmIsOpen) {
            confirmIsOpen = false;
            talkedRecently.delete(user.id + "g");
            switch (reaction.emoji.name) {
                case "✅":
                    await removePlayerFromGuild(user, guild)
                    message.channel.send(Text.commands.guildAdd.checkMark + user.toString() + Text.commands.guildLeave.gLeave + guild.name + Text.commands.guildLeave.gLeaveEnd);
                    break;
                case "❌":
                    message.channel.send(Text.commands.guildAdd.x + user.toString() + Text.commands.guildLeave.gLeaveRefuse);
                    break;
            }
        }
    });
}

async function removePlayerFromGuild(user, guild) {
    let player = await playerManager.getPlayerById(user.id);
    player.setGuildId("0");
    playerManager.updatePlayer(player);
}

async function destroyGuild(guild) {
    let members = await guildManager.getGuildMembers(guild.getGuildId());
    await members.forEach(m => kickMember(m));
    guildManager.deleteGuild(guild.getGuildId());
}

function kickMember(member) {
    member.setGuildId("0");
    playerManager.updatePlayer(member);
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
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(user.toString() + Text.commands.guildLeave.notInAGuildError);
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

module.exports.guildLeaveCommand = guildLeaveCommand;