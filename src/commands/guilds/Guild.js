//Discord API
const Discord = require("discord.js");
const DefaultValues = require('../../utils/DefaultValues');
const PlayerManager = require('../../classes/PlayerManager');
const ServerManager = require('../../classes/ServerManager');
const GuildManager = require('../../classes/GuildManager');
const ProgressBar = require('../../classes/ProgressBar');
const Tools = require('../../utils/Tools');

let Text
let playerManager = new PlayerManager();
let serverManager = new ServerManager();
let guildManager = new GuildManager();

/**
 * Allow to charge the prefix of the server
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargePrefix = async function (message) {
    return await serverManager.getServerPrefix(message);
}

/**
 * Allow to display the rankings of the players
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const guildCommand = async function (message, args, client) {
    Text = await Tools.chargeText(message);
    let serverPrefix = await chargePrefix(message);
    let guildName = await message.content.slice(serverPrefix.length).trim().replace(args[0], "").substring(1); //substring is used to remove the space before the guild name
    let guild;

    if (args.length >= 2) {
        let userMention = getUserFromMention(message);

        if (userMention !== null && userMention !== undefined) {
            guild = await guildManager.getGuildByUserId(userMention.id)
        }
    }

    if (guild === null || guild === undefined) {
        guild = await guildManager.getGuildByName(guildName)
    }

    if (guildName.length === 0 || guildName === undefined) {
        guild = await guildManager.getCurrentGuild(message);
    }

    if (guild === null || guild === undefined) {
        message.channel.send(generateNoGuildException());
        return;
    }

    let members = await guildManager.getGuildMembers(guild.getGuildId());
    let messageGuild = await generateGuildMessage(message, client, guild, members);
    message.channel.send(messageGuild);
}


/**
 * Returns a string containing the nodrink message.
 * @returns {String} - A string containing the nodrink message.
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} user - The user that called this command
 */
const generateGuildMessage = async function (message, client, guild, members) {
    let embed = generateDefaultEmbed();
    embed.setThumbnail(Text.commands.guild.guildIcon);

    let chief = await getUserById(client, guild.getChief());
    let guildName = guild.getName();
    let guildMembers = await generatePlayersData(client, members);

    embed.setTitle(Text.commands.guild.guild + guildName);
    embed.setDescription(Text.commands.guild.chief + chief.toString() + Text.commands.guild.chiefIcon)
    embed.addField(Text.commands.guild.memberIcon + getGuildMembersCount(members) + Text.commands.guild.members, guildMembers);

    let experience = guild.getExperience();
    let experienceToLevelUp = guild.getExperienceToLevelUp();
    let level = guild.getLevel();
    let barSize = 20;

    const progressBar = new ProgressBar(experience, experienceToLevelUp, barSize);

    embed.addField(Text.commands.guild.star + experience + Text.commands.guild.expSeparator + experienceToLevelUp
        + Text.commands.guild.guildLevel + level, Text.commands.guild.style + progressBar.createBar() + Text.commands.guild.style);

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
 * Transform a discord id into an user
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param {*} id - The user id
 */
async function getUserById(client, id) {
    const user = await client.users.get(id);
    return user;
}

/**
 * Get the number of user in the guild
 * @param {*} members - The guild members list
 */
const getGuildMembersCount = function (members) {
    return new String(members.length + Text.commands.guild.over5);
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
 * Generate guild members score and rank text
 * @param {*} client - The bot client
 * @param {*} members - The guild members
 */
async function generatePlayersData(client, members) {
    if (members.length === 1) {
        return await generatePlayerData(client, members[0]);
    } else {
        let text = "";
        for (let i = 0; i < members.length; i++) {
            text += await generatePlayerData(client, members[i])
        }
        return text;
    }
}

/**
 * Generate the player score and rank text
 * @param {*} client - The bot client
 * @param {*} player - The player
 */
const generatePlayerData = async function (client, player) {
    let pseudo = player.getPseudo(client);
    if (pseudo == null) {
        pseudo = Text.player.unknownPlayer
    }
    return Text.commands.guild.playerDataStart + pseudo + Text.commands.guild.playerDataInfosStart + await playerManager.getPlayerRank(player.id) + Text.commands.guild.trophy + player.getScore() + Text.commands.guild.medal;
}

/**
 * The default embed style for the bot
 */
const generateDefaultEmbed = function () {
    return new Discord.RichEmbed().setColor(DefaultValues.embed.color);
}

module.exports.guildCommand = guildCommand;