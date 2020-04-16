//Discord API
const Discord = require("discord.js");
const DefaultValues = require('../../utils/DefaultValues');
const PlayerManager = require('../../classes/PlayerManager');
const ServerManager = require('../../classes/ServerManager');
const GuildManager = require('../../classes/GuildManager');
const Tools = require('../../utils/Tools');

let Text

let serverManager = new ServerManager();
let guildManager = new GuildManager();
let playerManager = new PlayerManager();

/**
 * Allow to charge the prefix of the server
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargePrefix = async function (message) {
    return await serverManager.getServerPrefix(message);
}

/**
 * Allow to create a guild
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @param args - arguments typed by the user in addition to the command
 */
guildCreateCommand = async function (message, args, client, talkedRecently) {
    Text = await Tools.chargeText(message);
    let serverPrefix = await chargePrefix(message);
    let guildName;
    let guild = await guildManager.getCurrentGuild(message);

    if (talkedRecently.has(message.author.id + "g") || talkedRecently.has(message.author.id)) {
        message.channel.send(displaySpamErrorMessage());
        return;
    }

    if (guild !== null) {
        message.channel.send(generateAlreadyInAGuildException(message));
        return;
    }

    if (args.length > 1) { //There is a name
        guildName = await message.content.slice(serverPrefix.length).trim().replace(args[0], "").substring(1); //substring is used to remove the space before the guild name
        if (guildName.length > 1 && guildName.length < 15) { //Configure guild name length
            if (guildNameCorrect(guildName)) {
                let nameAvailability = await guildManager.checkNewNameAvailability(guildName)
                if (nameAvailability === true) {
                    message.channel.send(await generateGuildCreateMessage(message, guildName)).then(async msg => {
                        await addBasicReactions(msg); //Add reactions
                        const filterConfirm = (reaction, user) => {
                            return (confirmReactionIsCorrect(reaction) && user.id === message.author.id);
                        };
                        const collector = msg.createReactionCollector(filterConfirm, {
                            time: 120000
                        });
                        //execute this if a user answer to the event
                        talkedRecently.add(message.author.id + "g");
                        talkedRecently.add(message.author.id);
                        await createCollector(collector, message, message.author, guildName, talkedRecently);
                    });
                } else {
                    message.channel.send(generateNameNotAvailableException(guildName));
                }
            } else {
                message.channel.send(generateNoPunctuationException(message));
            }
        } else {
            message.channel.send(generateTooLongNameException(message));
            return;
        }
    } else {
        message.channel.send(generateEmptyNameException(message, serverPrefix));
        return;
    }
}

/**
 * Send a message to warn the user he doesnt have enough money
 * @param {*} message - The message that launched the command
 */
function notEnoughMoney(message) {
    return Text.commands.shop.cancelStart + message.author + Text.commands.shop.notEnoughEnd;
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
 * Display an error if the user is spamming the command
 */
function displaySpamErrorMessage() {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildAdd.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(Text.commands.guildCreate.spamError);
    return embed;
}

/**
 * Creating the reactions collector and possibilities
 * @param {*} collector - The collector
 */
async function createCollector(collector, message, user, guildName, talkedRecently) {
    let confirmIsOpen = true
    collector.on('end', () => {
        if (confirmIsOpen) {
            talkedRecently.delete(message.author.id + "g");
            talkedRecently.delete(message.author.id);
            message.channel.send(Text.commands.guildAdd.x + user.toString() + Text.commands.guildAdd.gJoinRefuse);
        }
    });
    return collector.on('collect', async (reaction) => {
        if (confirmIsOpen) {
            confirmIsOpen = false;
            talkedRecently.delete(message.author.id);
            talkedRecently.delete(message.author.id + "g");
            switch (reaction.emoji.name) {
                case "✅":
                    await checkIfUserHasEnoughMoney(message, await playerManager.getPlayerById(user.id, message), guildName, user)
                    break;
                case "❌":
                    message.channel.send(Text.commands.guildCreate.x + user.toString() + Text.commands.guildCreate.cancelled);
                    break;
            }
        }
    });
}

/**
 * Check if the player has enough money to buy a guild
 * @param {*} user - The player
 */
async function checkIfUserHasEnoughMoney(message, player, guildName, user) {
    if (player.money >= 5000) {
        player.addMoney(-5000)
        await setupGuild(message, user, guildName, player);
        message.channel.send(Text.commands.guildCreate.checkmark + user.toString() + Text.commands.guildCreate.valid + guildName + Text.commands.guildCreate.create);
    } else {
        message.channel.send(notEnoughMoney(message));
    }
}

/**
 * Create the new guild and add the chief into it
 */
async function setupGuild(message, user, guildName, player) {
    let guild = await guildManager.getNewGuild(message, user.id, guildName);
    guildManager.addGuild(guild);
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
 *
 * Returns a string containing the guildCreate message.
 * @returns {boolean} - If the name if correct
 * @param {*} guildName - The name of the guild
 */
const guildNameCorrect = function (guildName) {
    const regexAllowed = RegExp(/^[A-Za-z0-9 ÇçÜüÉéÂâÄäÀàÊêËëÈèÏïÎîÔôÖöÛû]+$/);
    const regexSpecialCases = RegExp(/^[0-9 ]+$|( {2})+/);
    return regexAllowed.test(guildName) && !regexSpecialCases.test(guildName);
}

/**
 * @returns {String} - A RichEmbed message wich display the GuildSetupException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
async function generateGuildSetupException(message) {
    return Text.commands.guildCreate.x + user.toString() + Text.commands.guildCreate.cancelled2;
}

/**
 *
 * Returns a string containing the guildCreate message.
 * @returns {String} - A string containing the nodrink message.
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateGuildCreateMessage = async function (message, guildName) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildCreate.Gbuy);
    embed.setThumbnail(Text.commands.guildCreate.guildIcon);
    embed.setDescription(message.author + Text.commands.guildCreate.Gcreate + guildName +
        Text.commands.guildCreate.price);
    embed.setFooter(Text.commands.guildCreate.rename, null);
    return embed;
}

/**
 * Return a empty name exception
 * @param {*} serverPrefix 
 */
const generateEmptyNameException = function (serverPrefix) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildCreate.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(Text.commands.guildCreate.emptyName + serverPrefix + Text.commands.guildCreate.emptyName2);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NameNotAvailableException
 * @param {*} guildName - The name wanted for his guild by the user
 */
const generateNameNotAvailableException = function (guildName) {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildCreate.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(Text.commands.guildCreate.Gname + guildName + Text.commands.guildCreate.Gname2);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the AlreadyInAGuildException
 */
const generateAlreadyInAGuildException = function () {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildCreate.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(Text.commands.guildCreate.alreadyInAGuild);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the NoPunctuationException
 */
const generateNoPunctuationException = function () {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildCreate.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(Text.commands.guildCreate.characters);
    return embed;
}

/**
 * @returns {String} - A RichEmbed message wich display the TooLongNameException
 * @param {*} message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateTooLongNameException = function () {
    let embed = generateDefaultEmbed();
    embed.setTitle(Text.commands.guildCreate.error);
    embed.setColor(DefaultValues.guild.errorColor);
    embed.setDescription(Text.commands.guildCreate.characters2);
    return embed;
}

/**
 * The default embed style for the bot
 */
const generateDefaultEmbed = function () {
    return new Discord.RichEmbed().setColor(DefaultValues.embed.color);
}

module.exports.guildCreateCommand = guildCreateCommand;