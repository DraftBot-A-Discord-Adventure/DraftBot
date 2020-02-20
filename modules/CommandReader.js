const Config = require('./utils/Config');
const ServerManager = require('./classes/ServerManager');
const PlayerManager = require('./classes/PlayerManager');
const CommandTable = require('./CommandTable');
const Text = require('./text/fr');
const Console = require('./text/Console');

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
        this.traceMessage(message, client);
        let serverPrefix = await this.serverManager.getServerPrefix(message);
        let prefix = CommandReader.getUsedPrefix(message);
        if (prefix == serverPrefix) {
            //if (message.author.id != Config.BOT_OWNER_ID) return message.channel.send(":x: Le Draftbot est actuellement en maintenance: Pour plus d'infos, visitez le discord du bot http://draftbot.tk \n\n :flag_um: The bot is being updated please be patient :) ");
            launchCommand(message, client, talkedRecently);
        } else {
            if (prefix == Config.BOT_OWNER_PREFIX && message.author.id == Config.BOT_OWNER_ID) {
                launchCommand(message, client, talkedRecently);
            }
        }
    }


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
            for (let i=1; i < 5; i++) {
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
