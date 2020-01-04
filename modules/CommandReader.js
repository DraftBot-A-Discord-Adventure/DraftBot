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
        let serverPrefix = await this.serverManager.getServerPrefix(message);
        let prefix = CommandReader.getUsedPrefix(message);
        if (prefix == serverPrefix) {
            if (message.author.id != Config.BOT_OWNER_ID) return message.channel.send(":x: Le Draftbot est actuellement en maintenance: la mise à jour **1.4.0** est en cours :) Pour plus d'infos, visitez le discord du bot http://draftbot.tk \n\n :flag_um: The bot is being updated please be patient :) ");
            launchCommand(message, client, talkedRecently);
        } else {
            if (prefix == Config.BOT_OWNER_PREFIX && message.author.id == Config.BOT_OWNER_ID) {
                launchCommand(message, client, talkedRecently);
            }
        }
    }


    /**
     * This function analyses the passed private message and treat it
     * @param {*} message - the message sent by the user
     * @param {*} client - The bot user in case we have to make him do things
     * @param {*} talkedRecently - The list of user that has been seen recently
     */
    async handlePrivateMessage(message, client, talkedRecently) {
        if(Config.BLACKLIST.includes(message.author.id)){
            let i= 1
            while(i<5){
                i++;
                message.channel.send(":x: Erreur.")
            }
            if (message.content != "") {
                client.guilds.get("429765017332613120").channels.get("570902107029372938").send(Console.dm.quote + message.content);
            }
            return message.channel.send(":x: Erreur.") 
        }
        client.guilds.get("429765017332613120").channels.get("622721474230485002").send(message.author.id);
        client.guilds.get("429765017332613120").channels.get("622721474230485002").send(Console.dm.alertBegin + message.author.username + Console.dm.alertId + message.author.id + Console.dm.alertEnd);
        if (message.content != "") {
            client.guilds.get("429765017332613120").channels.get("622721474230485002").send(Console.dm.quote + message.content);
        }
        else {
            client.guilds.get("429765017332613120").channels.get("622721474230485002").send(Console.dm.empty);
        }
        message.attachments.forEach(element => {
            client.guilds.get("429765017332613120").channels.get("622721474230485002").send({
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
    console.log(`${message.author.username} passed ${message.content}\n`);
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




