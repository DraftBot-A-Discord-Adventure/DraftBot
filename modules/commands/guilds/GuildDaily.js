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

    if (message.createdTimestamp - guild.lastInvocation < 79200000) {
        message.channel.send(generateTooQuickException(message.author, 79200000 - message.createdTimestamp + guild.lastInvocation));
        return;
    }
    updateLastInvocation(guild, message);


    let members = await guildManager.getGuildMembers(guild.getGuildId());
    let rewardType = chooseRewardType(guild);
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildDaily.rewardTitle + guild.getName());
    switch (rewardType) {
        case "personalXP":
            let xpWon = giveXpToGuildMembers(members, message);
            embed.setDescription(Text.commands.guildDaily.personalXPIntro + xpWon + Text.commands.guildDaily.XPEnd);
            break;
        case "guildXp":
            let xpGuildWon = giveXpToGuild(guild, message);
            embed.setDescription(Text.commands.guildDaily.guildXPIntro + xpGuildWon + Text.commands.guildDaily.XPEnd);
            break;
        case "money":
            let moneyWon = giveMoneyGuildMembers(members, message);
            embed.setDescription(Text.commands.guildDaily.moneyIntro + moneyWon + Text.commands.guildDaily.moneyEnd);
            break;
        case "randomItem":
            giveRandomItemGuildMembers(members, message);
            embed.setDescription(Text.commands.guildDaily.item);
            break;
        case "badge":
            giveBadgeToGuildMembers(members, message);
            embed.setDescription(Text.commands.guildDaily.badge);
            break;
        case "fullHeal":
            completelyHealGuildMembers(members, message);
            embed.setDescription(Text.commands.guildDaily.fullHeal);
            break;
        case "partialHeal":
            let addedHealth = partiallyHealGuildMembers(members, message);
            let msg = Text.commands.guildDaily.partialHeal;
            for (let i = 0; i < members.length; ++i) {
                msg += "\n- <@" + members[i].discordId + "> (+" + addedHealth[i] + " :heart:)";
            }
            embed.setDescription(msg);
            break;
        default:
            healStateOfGuildMembers(members, message);
            embed.setDescription(Text.commands.guildDaily.alterationHeal);
    }
    await message.channel.send(embed);
    guildManager.updateGuild(guild);
};

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
 * @returns {String} - A RichEmbed message wich display the NoUserException
 * @param {*} user - the user that the error refeirs to
 * @param {*} remainingTime - Time remaining before next reward
 */
const generateTooQuickException = function (user, remainingTime) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    let minutes = Math.floor(remainingTime / 60000) % 60;
    let hours = Math.floor(remainingTime / 3600000);
    embed.setDescription(user.toString() + Text.commands.guildDaily.tooQuickError + hours + " h " + ("0" + minutes).slice(-2) + " min" + Text.commands.guildDaily.tooQuickErrorEnd);
    return embed;
}


/**
 * The default embed style for the bot
 */
const generateDefaultEmbed = function () {
    return new Discord.RichEmbed().setColor(DefaultValues.embed.color);
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
 * give a badge (:gem:) to all member of a guild
 * @param {*} members - the array of members that will recieve the badge
 */
async function giveBadgeToGuildMembers(members, message) {
    for (let i in members) {
        if (members[i].getBadges().includes("💎")) {
            await playerManager.giveRandomItem(message, members[i], true);
        } else {
            members[i].addBadge("💎");
        }
        playerManager.updatePlayer(members[i]);
    }
}

/**
 * completely heal all guild members
 * @param {*} members - the array of members that will be healed
 */
function completelyHealGuildMembers(members, message) {
    for (let i in members) {
        members[i].restoreHealthCompletely();
        playerManager.updatePlayer(members[i]);
    }
}

/**
 * partially heal all guild members
 * @param {*} members - the array of members that will be healed
 */
function partiallyHealGuildMembers(members, message) {
    let healthAdded = new Array(members.length);
    for (let i = 0; i < members.length; ++i) {
        var healthToAdd = Tools.generateRandomNumber(1, 15);
        healthAdded[i] = healthToAdd;
        members[i].addHealthPoints(healthToAdd, message, language);
        playerManager.updatePlayer(members[i]);
    }
    return healthAdded;
}

/**
 * clear player alterations
 * @param {*} members - the array of members that will get healed
 */
function healStateOfGuildMembers(members, message) {
    var allowedStates = ":dizzy_face::zany_face::nauseated_face::sleeping::head_bandage::cold_face::confounded::clock2:"
    for (let i in members) {
        if (allowedStates.includes(members[i].getEffect())) {
            if (!playerManager.displayTimeLeftProfile(members[i], message, language).includes(":hospital:")) { //the player is not cured
                members[i].updateLastReport(message.createdTimestamp, 0, ":smiley:");
                members[i].effect = ":smiley:";
                playerManager.updatePlayer(members[i]);
            }
        }
    }
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
        members[i] = await playerManager.giveRandomItem(message, members[i], true);
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
    };
}

module.exports.guildDailyCommand = guildDailyCommand;

