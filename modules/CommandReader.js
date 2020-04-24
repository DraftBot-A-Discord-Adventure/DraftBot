const Config = require('./utils/Config');
const ServerManager = require('./classes/ServerManager');
const PlayerManager = require('./classes/PlayerManager');
const CommandTable = require('./CommandTable');
const Text = require('./text/fr');
const Console = require('./text/Console');
const moment = require("moment");
const Discord = require("discord.js");
const DefaultValues = require('./utils/DefaultValues');
const Tools = require('./utils/Tools');

class CommandReader {
    constructor() {
        this.serverManager = new ServerManager();
        this.playerManager = new PlayerManager();
    }

    /**
     * This function analyses the passed message and calls the associated function if there is one.
     * @param {*} message - A command posted by an user.
     * @param {*} client - The bot user in case we have to make him do things
     * @param {*} talkedRecently - The list of user that has been seen recently
     */
    async handleMessage(message, client, talkedRecently) {
        let serverPrefix = await this.serverManager.getServerPrefix(message);
        let prefix = CommandReader.getUsedPrefix(message);
        if (prefix == serverPrefix) {
            this.traceMessage(message, client);
            const diffMinutes = getMinutesBeforeReset();
            if (resetIsNow(diffMinutes)) {
                const embed = await generateResetTopWeekEmbed(message);
                return message.channel.send(embed)
            }
            //if (message.author.id != Config.BOT_OWNER_ID) return message.channel.send(":x: Le Draftbot est actuellement en maintenance: Pour plus d'infos, visitez le discord du bot https://discord.gg/USnCxg4 \n\n :flag_um: The bot is being updated please be patient :) ");
            launchCommand(message, client, talkedRecently);
        } else {
            if (prefix == Config.BOT_OWNER_PREFIX && message.author.id == Config.BOT_OWNER_ID) {
                launchCommand(message, client, talkedRecently);
            }
        }
    }

    /**
     * log the recieved message on the console
     * @param {*} message 
     */
    traceMessage(message) {
        let trace = `---------\nMessage recu sur le serveur : ${message.guild.name} - id ${message.guild.id}\nAuteur du message : ${message.author.username} - id ${message.author.id}\nMessage : ${message.content}`;
        console.log(trace);
    }

    /**
     * This function analyses the passed private message and treat it
     * @param {*} message - the message sent by the user
     * @param {*} client - The bot user in case we have to make him do things
     * @param {*} talkedRecently - The list of user that has been seen recently
     */
    async handlePrivateMessage(message, client, talkedRecently) {
        if (Config.BLACKLIST.includes(message.author.id)) {
            for (let i = 1; i < 5; i++) {
                message.channel.send(":x: Erreur.")
            }
            if (message.content != "") {
                client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.TRASH_DM_CHANNEL_ID).send(Console.dm.quote + message.content);
            }
            return message.channel.send(":x: Erreur.")
        }
        client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(message.author.id);
        client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(Console.dm.alertBegin + message.author.username + Console.dm.alertId + message.author.id + Console.dm.alertEnd);
        if (message.content != "") {
            client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(Console.dm.quote + message.content);
        }
        else {
            client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(Console.dm.empty);
        }
        message.attachments.forEach(element => {
            client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send({
                files: [{
                    attachment: element.url,
                    name: element.filename
                }]
            });
        });
    }


    /**
     * Sanitizes the string and return the command. The command should always be the 1st argument.
     * @param {*} message - The message to extract the command from.
     * @returns {String} - The command, extracted from the message.
     */
    static getCommandFromMessage(message) {
        return CommandReader.getArgsFromMessage(message).shift().toLowerCase();
    }

    /**
     * Sanitizes the string and return the args. The 1st argument is not an args.
     * @param {*} message - The message to extract the command from.
     * @returns {string} - args, extracted from the message.
     */
    static getArgsFromMessage(message) {
        return message.content.slice(Config.PREFIXLENGTH).trim().split(/ +/g);
    }
    /**
     * Get the prefix that the user just used to make the command
     * @param {*} message - The message to extract the command from.
     */
    static getUsedPrefix(message) {
        return message.content.substr(0, 1);
    }
}

/**
 * Generate the embed that the bot has to send if the top week is curently beeing reset
 * @param {*} message - the message used to get this embed
 */
async function generateResetTopWeekEmbed(message) {
    const embed = new Discord.RichEmbed();
    let Text = await Tools.chargeText(message);
    embed.setColor(DefaultValues.embed.color);
    embed.setTitle(Text.commandReader.resetIsNowTitle);
    embed.setDescription(Text.commandReader.resetIsNowFooter);
    return embed;
}

/**
 * True if the reset is now (every sunday at midnight)
 * @param {*} diffMinutes - The amount of minutes before the next reset
 */
function resetIsNow(diffMinutes) {
    return diffMinutes < 3 && diffMinutes > -1;
}

/**
 * Get the amount of minutes before the next reset
 */
function getMinutesBeforeReset() {
    var now = new Date(); //The current date
    var dateOfReset = new Date(); // The next Sunday
    dateOfReset.setDate(now.getDate() + (0 + (7 - now.getDay())) % 7); // Calculating next Sunday
    dateOfReset.setHours(22, 59, 59); // Defining hours, min, sec to 23, 59, 59
    //Parsing dates to moment
    var nowMoment = new moment(now);
    var momentOfReset = new moment(dateOfReset);
    const diffMinutes = momentOfReset.diff(nowMoment, 'minutes');
    return diffMinutes;
}

/**
 *
 * @param {*} message - A command posted by an user.
 * @param {*} client - The bot user in case we have to make him do things
 * @param {*} talkedRecently - The list of user that has been seen recently
 */
function launchCommand(message, client, talkedRecently) {
    let command = CommandReader.getCommandFromMessage(message);
    let args = CommandReader.getArgsFromMessage(message);
    if (CommandTable.has(command))
        if (!message.channel.permissionsFor(client.user).serialize().SEND_MESSAGES) { //test if the bot can speak in the channel where a command has been read
            message.author.send(Text.error.noSpeakPermission);
        } else {
            CommandTable.get(command)(message, args, client, talkedRecently);
        }
}

module.exports = CommandReader;
