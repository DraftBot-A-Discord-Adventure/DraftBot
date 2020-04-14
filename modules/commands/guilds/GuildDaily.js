//Discord API
const Discord = require("discord.js");
const DefaultValues = require('../../utils/DefaultValues');
const PlayerManager = require('../../classes/PlayerManager');
const GuildManager = require('../../classes/GuildManager');
const Tools = require('../../utils/Tools');

let Text
let language

let playerManager = new PlayerManager();
let guildManager = new GuildManager();


/**
 * Allow to display the rankings of the players
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
const guildDailyCommand = async function (message, args, client) {
    Text = await Tools.chargeText(message);
    language = await Tools.detectLanguage(message);

    let guild = await guildManager.getCurrentGuild(message);
    if (guild === null) {
        message.channel.send(generateNotInAGuildException(message.author));
        return;
    }
    let members = await guildManager.getGuildMembers(guild.getGuildId());
    let rewardType = chooseRewardType(guild);
    switch (rewardType) {
        case "personalXP":
            let xpWon = giveXpToGuildMembers(members, message);
            message.channel.send("les joueurs ont recu " + xpWon + "xp")
            break;
        case "guildXp":
            let xpGuildWon = giveXpToGuild(guild, message);
            message.channel.send("la guilde a recu " + xpGuildWon + "xp")
            break;
        case "money":
            let moneyWon = giveMoneyGuildMembers(members, message);
            message.channel.send("les joueurs ont recu " + moneyWon + "d'argent")
            break;
        case "randomItem":
            giveRandomItemGuildMembers(members, message);
            message.channel.send("les joueurs ont recu un item random")
            break;
        default:

    }
    message.channel.send(rewardType)
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
 * The default embed style for the bot
 */
const generateDefaultEmbed = function () {
    return new Discord.RichEmbed().setColor(DefaultValues.embed.color);
}

module.exports.guildDailyCommand = guildDailyCommand;

/**
 * give a random amount of xp to all member of a guild
 * @param {*} members - the array of members that will recieve the xp
 * @param {*} message 
 */
function giveXpToGuildMembers(members, message) {
    let xpWon = Tools.generateRandomNumber(1, 20) * 5;
    for (let i in members) {
        members[i].addExperience(xpWon, message, language);
        playerManager.updatePlayer(members[i]);
    }
    return xpWon;
}

/**
 * give a random amount of money to all member of a guild
 * @param {*} members - the array of members that will recieve the xp
 * @param {*} message 
 */
function giveMoneyGuildMembers(members, message) {
    let moneyWon = Tools.generateRandomNumber(10, 300);
    for (let i in members) {
        members[i].addMoney(moneyWon)
        playerManager.updatePlayer(members[i]);
    }
    return moneyWon;
}

/**
 * give a random amount of money to all member of a guild
 * @param {*} members - the array of members that will recieve the xp
 * @param {*} message 
 */
async function giveRandomItemGuildMembers(members, message) {
    for (let i in members) {
        members[i] = await playerManager.giveRandomItem(message, members[i])
        playerManager.updatePlayer(members[i]);
    }
}

/**
 * give a random amount of xp to all member of a guild
 * @param {*} guild  - the guild that will recieve the xp
 * @param {*} message 
 */
function giveXpToGuild(guild, message) {
    let xpWon = Tools.generateRandomNumber(20, 80);
    guild.addExperience(xpWon, message, language);
    guildManager.updateGuild(guild);
    return xpWon;
}

/**
 * get the reward the user will get
 * @param {*} guild 
 */
function chooseRewardType(guild) {
    let resultNumber = Tools.generateRandomNumber(0, 1000);
    let rewardLevel = Math.floor(guild.level / 10);
    let recompenses = DefaultValues.guildChances[rewardLevel];
    for (const property in recompenses) {
        if (recompenses[property] < resultNumber) {
            resultNumber -= recompenses[property];
        }
        else {
            return property;
        }
    }
    ;
}
