const Tools = require('../utils/Tools');
const ServerManager = require('../classes/ServerManager');
let Text;

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Base class that shouldn't be instantiated. Instead, Entities are meant to extend this class.
 * Entities are things like Enemies, entitys...
 */
class ProgressBar {
    constructor(value, maxValue, barSize) {
            this.value = value;
            this.maxValue = maxValue;
            this.barSize = barSize;
    }

    /**
     * Create a text progress bar
     * @returns {String} - The bar
     */
    createBar() {
        let percentage = this.value / this.maxValue; //Calculate the percentage of the bar
        let progress = Math.round((this.barSize * percentage)); //Calculate the number of square caracters to fill the progress side.
        let emptyProgress = this.barSize - progress; //Calculate the number of dash caracters to fill the empty progress side.

        let progressText = "▇".repeat(progress); //Repeat is creating a string with progress * caracters in it
        let emptyProgressText = "—".repeat(emptyProgress); //Repeat is creating a string with empty progress * caracters in it
        let percentageText = Math.round(percentage * 100) + "%"; //Displaying the percentage of the bar

        let bar = "[" + progressText + emptyProgressText + "] " + percentageText; //Creating the bar
        return bar;
    }

}

module.exports = ProgressBar;