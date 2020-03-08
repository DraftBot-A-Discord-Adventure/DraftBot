const DefaultValues = require('../utils/DefaultValues');
const ServerManager = require('../classes/ServerManager');
const Config = require('../utils/Config');
const InventoryManager = require('../classes/InventoryManager');

/**
 * convert a number of minutes in a number of miliseconds
 * @param minutes - The number of minutes
 * @returns {Number} - The number of miliseconds
 */
const convertMinutesInMiliseconds = function (minutes) {
    return minutes * 60000;
};


/**
 * convert a number of hours in a number of miliseconds
 * @param hours - The number of hours
 * @returns {Number} - The number of miliseconds
 */
const convertHoursInMiliseconds = function (hours) {
    return this.convertMinutesInMiliseconds(hours * 60);
};


/**
 * convert a number of milliseconds in a number of minutes
 * @param miliseconds - The number of milliseconds
 * @returns {Number} - The number of minutes
 */
const convertMillisecondsInMinutes = function (milliseconds) {
    return Math.round(milliseconds / 60000);
};


/**
 * generate a random number
 * @param min - The minimal Value
 * @param max - The maximal Value
 * @returns {Number} - A random Number
 */
const generateRandomNumber = function (min, max) {
    return Math.round(Math.random() * (max - min) + min);
};


/**
 * return a string containing a proper display of a duration
 * @param {Number} minutes - The number of minutes to display
 * @returns {String} - The  string to display
 */
const displayDuration = function (minutes) {
    let heures = 0;
    let display = "";
    while (minutes >= 60) {
        heures++;
        minutes -= 60;
    }
    if (heures > 0)
        display += heures + " H ";
    display += minutes + " Min";
    if (heures == 0 && minutes == 0)
        display = "Quelques secondes...";
    return display
};


/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == Config.ENGLISH_CHANNEL_ID) {
        server.language = "en";
    }
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Allow to get the language the bot has to respond with
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @returns {string} - the code of the server language
 */
const detectLanguage = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == Config.ENGLISH_CHANNEL_ID) {
        server.language = "en";
    }
    return server.language;;
}

/**
 * Generate a random rareness. Legendary is very rare and common is not rare at all
 * @returns {Number} - the number refering to a rareness (1 - 8)
 */
const generateRandomRareness = function () {
    let randomValue = Math.round(Math.random() * DefaultValues.raritiesGenerator.maxValue);
    let result;
    if (randomValue <= DefaultValues.raritiesGenerator['0']) {
        result = 1;
    } else if (randomValue <= DefaultValues.raritiesGenerator['1']) {
        result =2;
    } else if (randomValue <= DefaultValues.raritiesGenerator['2']) {
        result =3;
    } else if (randomValue <= DefaultValues.raritiesGenerator['3']) {
        result = 4;
    } else if (randomValue <= DefaultValues.raritiesGenerator['4']) {
        result = 5;
    } else if (randomValue <= DefaultValues.raritiesGenerator['5']) {
        result = 6;
    } else if (randomValue <= DefaultValues.raritiesGenerator['6']) {
        result = 7;
    } else {
        result = 8;
    }
    return result;
}

/**
 * Allow to add to the player stats the bonuses of its items
 * @param {*} player - One of the player that has to recieve the bonus
 */
const addItemBonus = async function (player) {
    let inventoryManager = new InventoryManager()
    let bonus = await inventoryManager.getDamageById(player.id);
    player.attack = player.attack + bonus;
    bonus = await inventoryManager.getDefenseById(player.id);
    player.defense = player.defense + bonus;
    bonus = await inventoryManager.getSpeedById(player.id);
    player.speed = player.speed + bonus;
}

/**
 * Allow to add to the player stats the bonuses of its items
 * @param {*} player - One of the player that has to recieve the bonus
 */
const seeItemBonus = async function (player) {
    let inventoryManager = new InventoryManager()
    let bonus = await inventoryManager.seeDamageById(player.id);
    player.attack = player.attack + bonus;
    bonus = await inventoryManager.seeDefenseById(player.id);
    player.defense = player.defense + bonus;
    bonus = await inventoryManager.seeSpeedById(player.id);
    player.speed = player.speed + bonus;
}

//Exports
module.exports.convertHoursInMiliseconds = convertHoursInMiliseconds;
module.exports.convertMinutesInMiliseconds = convertMinutesInMiliseconds;
module.exports.convertMillisecondsInMinutes = convertMillisecondsInMinutes;
module.exports.displayDuration = displayDuration;
module.exports.generateRandomNumber = generateRandomNumber;
module.exports.chargeText = chargeText;
module.exports.detectLanguage = detectLanguage;
module.exports.addItemBonus = addItemBonus;
module.exports.seeItemBonus = seeItemBonus;
module.exports.generateRandomRareness = generateRandomRareness;
