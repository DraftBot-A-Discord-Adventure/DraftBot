//Discord API
const Discord = require("discord.js");

const Config = require('../modules/utils/Config');
const ServerManager = require('./classes/ServerManager');
const PlayerManager = require('./classes/PlayerManager');

class DisplayStyleManager {
    constructor() {
        this.playerManager = new PlayerManager();
    }

    /**
     * @param {*} message - A command posted by an user.
     * @returns {*} displaystyle - Return the displaystyle param.
     * @Text {*} Text - Return all sentences to be display in the message.
     */
    async checkDisplayStyleValidity(message, command) {
        let displaystyle = await this.getDisplayStyle(message);
        const Text = await chargeText(message);

        if (displaystyle !== "classic" && displaystyle !== "embed" && command != "displaystyle") { //Check if param is null
            //Creating Embed
            const embed = new Discord.RichEmbed();
            embed.setColor(Config.EMBED_COLOR);
            embed.setTitle(Text.settings.displaystyle.title);
            embed.setDescription(Text.settings.displaystyle.description);
            embed.addField(Text.settings.displaystyle.help, Text.settings.displaystyle.endSentence, false);

            //Sending it
            message.channel.send(embed);
            
            return false; //Not valid.
        } else {
            return true; //Valid.
        }
    }

    /**
     * @param {*} message - A command posted by an user.
     * @returns {*} displaystyle - If user wants to display bot messages in the embed format, it returns true.
     */
    async getDisplayStyle(message) {
        const playerManager = new PlayerManager;
        let player = await playerManager.getCurrentPlayer(message);
        let displaystyle = await player.displaystyle;

        return displaystyle;
    }
}

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
async function chargeText(message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    let address = './text/' + server.language;
    return require(address);
}




module.exports = DisplayStyleManager;




