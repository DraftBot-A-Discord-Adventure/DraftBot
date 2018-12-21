const PlayerManager = require('./PlayerManager');
const CommandTable = require('./CommandTable');

class CommandReader {
    constructor() {
        this.playerManager = new PlayerManager();
    }

    /**
     * This function analyses the passed message and calls the associated function if there is one.
     * @param message - A command posted by an user.
     */
    handleMessage(message) {
        console.log(`${message.author.username} passed ${message.content}\n`);
        let command = CommandReader.getCommandFromMessage(message);
        if (CommandTable.has(command)) {
            //TODO: Test commandResult's type, and process it!
            let commandResult = CommandTable.get(command)(message);
        }
    }

    /**
     * Sanitizes the string and return the command. The command should always be the 1st argument.
     * @param message - The message to extract the command from.
     * @returns {string} - The command, extracted from the message.
     */
    static getCommandFromMessage(message) {
        return message.content.trim().split(' ')[0];
    }

    /**
     * This function asks the PlayerManager class about the whereabouts of the message's author.
     * @param message - The message that contained the command. Used to get the author's Discord User ID
     */
    getPlayerPlace(message) {
        
    }
}

module.exports = CommandReader;