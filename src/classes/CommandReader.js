// const moment = require("moment");

class CommandReader {

    constructor() {
        this.commandTable = require('commands/CommandTable');
    }

    /**
     * This function analyses the passed message and calls the associated function if there is one.
     * @param {*} message - A command posted by an user.
     */
    async handleMessage(message) {
        let server = await draftbot.repositoryManager.ServerRepository.getByIdOrCreate(message.guild.id);
        let serverPrefix = server.get('prefix');
        let serverLanguage = server.get('language');

        if (serverPrefix === this.getUsedPrefix(message, serverPrefix)) {

            if (message.author.id !== Config.BOT_OWNER_ID && Config.MODE_MAINTENANCE) {
                return message.channel.send(":x: Le Draftbot est actuellement en maintenance: Pour plus d'infos, visitez le discord du bot https://discord.gg/USnCxg4 \n\n :flag_um: The bot is being updated please be patient :) ");
            }

            // TODO
            // this.traceMessage(message, client);
            // const diffMinutes = getMinutesBeforeReset();
            // if (resetIsNow(diffMinutes)) {
            //     const embed = await generateResetTopWeekEmbed(message);
            //     return message.channel.send(embed)
            // }

            await this.launchCommand(serverLanguage, serverPrefix, message);
        } else {
            if (this.getUsedPrefix(message, Config.BOT_OWNER_PREFIX) === Config.BOT_OWNER_PREFIX && message.author.id === Config.BOT_OWNER_ID) {
                await this.launchCommand(serverLanguage, Config.BOT_OWNER_PREFIX, message);
            }
        }
    }

    /**
     * Get the prefix that the user just used to make the command
     * @param {*} message - The message to extract the command from
     * @param {string} prefix - The prefix used by current server
     * @return {string}
     */
    getUsedPrefix(message, prefix) {
        return message.content.substr(0, prefix.length);
    }

    /**
     *
     * @param {*} message - A command posted by an user.
     * @param {string} prefix - The current prefix in the message content
     * @param {string} serverLanguage - The language for the current server
     */
    async launchCommand(serverLanguage,prefix, message) {
        let args = this.getCommandWithArgsFromMessage(message, prefix);
        let command = args.shift().toLowerCase();

        if (this.commandTable.has(command)) {
            if (!message.channel.permissionsFor(draftbot.client.user).serialize().SEND_MESSAGES) {
                await message.author.send(Config.text[serverLanguage].error.noSpeakPermission);
            } else {
                await this.commandTable.get(command)(serverLanguage, message, args);
            }
        }
    }

    /**
     * Sanitizes the string and return the command with args.
     * @param {*} message - The message to extract the command from.
     * @param {string} prefix - The current prefix in the message content
     * @returns {[string]}
     */
    getCommandWithArgsFromMessage(message, prefix) {
        return message.content.slice(prefix.length).trim().split(/ +/g);
    }

    // /**
    //  * log the recieved message on the console
    //  * @param {*} message
    //  */
    // traceMessage(message) {
    //     let trace = `---------\nMessage recu sur le serveur : ${message.guild.name} - id ${message.guild.id}\nAuteur du message : ${message.author.username} - id ${message.author.id}\nMessage : ${message.content}`;
    //     console.log(trace);
    // }
    //
    // /**
    //  * This function analyses the passed private message and treat it
    //  * @param {*} message - the message sent by the user
    //  * @param {*} client - The bot user in case we have to make him do things
    //  * @param {*} talkedRecently - The list of user that has been seen recently
    //  */
    // async handlePrivateMessage(message, client, talkedRecently) {
    //     if (Config.BLACKLIST.includes(message.author.id)) {
    //         for (let i = 1; i < 5; i++) {
    //             message.channel.send(":x: Erreur.")
    //         }
    //         if (message.content != "") {
    //             client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.TRASH_DM_CHANNEL_ID).send(Console.dm.quote + message.content);
    //         }
    //         return message.channel.send(":x: Erreur.")
    //     }
    //     client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(message.author.id);
    //     client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(Console.dm.alertBegin + message.author.username + Console.dm.alertId + message.author.id + Console.dm.alertEnd);
    //     if (message.content != "") {
    //         client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(Console.dm.quote + message.content);
    //     }
    //     else {
    //         client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send(Console.dm.empty);
    //     }
    //     message.attachments.forEach(element => {
    //         client.guilds.get(Config.MAIN_SERVER_ID).channels.get(Config.SUPPORT_CHANNEL_ID).send({
    //             files: [{
    //                 attachment: element.url,
    //                 name: element.filename
    //             }]
    //         });
    //     });
    // }
}

// /**
//  * Generate the embed that the bot has to send if the top week is curently beeing reset
//  * @param {*} message - the message used to get this embed
//  */
// async function generateResetTopWeekEmbed(message) {
//     const embed = new Discord.RichEmbed();
//     let Text = await Tools.chargeText(message);
//     embed.setColor(DefaultValues.embed.color);
//     embed.setTitle(Text.commandReader.resetIsNowTitle);
//     embed.setDescription(Text.commandReader.resetIsNowFooter);
//     return embed;
// }
//
// /**
//  * True if the reset is now (every sunday at midnight)
//  * @param {*} diffMinutes - The amount of minutes before the next reset
//  */
// function resetIsNow(diffMinutes) {
//     return diffMinutes < 3 && diffMinutes > -1;
// }
//
// /**
//  * Get the amount of minutes before the next reset
//  */
// function getMinutesBeforeReset() {
//     var now = new Date(); //The current date
//     var dateOfReset = new Date(); // The next Sunday
//     dateOfReset.setDate(now.getDate() + (0 + (7 - now.getDay())) % 7); // Calculating next Sunday
//     dateOfReset.setHours(22, 59, 59); // Defining hours, min, sec to 23, 59, 59
//     //Parsing dates to moment
//     var nowMoment = new moment(now);
//     var momentOfReset = new moment(dateOfReset);
//     const diffMinutes = momentOfReset.diff(nowMoment, 'minutes');
//     return diffMinutes;
// }

module.exports = CommandReader;
