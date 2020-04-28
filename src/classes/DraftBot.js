const RepositoryManager = require('orm/RepositoryManager');
const CommandReader = require('class/CommandReader');
const Discord = require("discord.js");

class DraftBot {

    constructor() {
        this.repositoryManager = new RepositoryManager();
        this.commandReader = new CommandReader(this.repositoryManager);
        this.discord = Discord;
        this.client = new Discord.Client();
    }

    /**
     * Checks if the easter eggs file exists and copy the default one if not
     */
    checkEasterEggsFile() {

        // let EasterEggs = require("./src/utils/eastereggs/EasterEggs");
        // EasterEggs.init();

        const fs = require("fs");
        if (!fs.existsSync("./src/utils/eastereggs/EasterEggs.js")) {
            fs.copyFileSync('./src/utils/eastereggs/EasterEggs.js.default', './src/utils/eastereggs/EasterEggs.js', (err) => {
                if (err) throw err;
            });
            console.warn("./src/utils/eastereggs/EasterEggs.js not found. ./src/utils/eastereggs/EasterEggs.js.default copied to be used.");
            console.warn("Ignore this message if you don't have the key to decrypt the file.");
        }
    }

    /**
     * Send a message in the channel "console" of the bot main server
     * @param {String} message
     */
    displayConsoleChannel(message) {
        this.client
            .guilds.cache.get(Config.MAIN_SERVER_ID)
            .channels.cache.get(Config.CONSOLE_CHANNEL_ID)
            .send(message)
            .catch(console.error);
    }

    setActivity() {
        this.client.user
            .setActivity("❓ - Dm me for Help !")
            .catch(console.error);
    }

}

module.exports = DraftBot;
