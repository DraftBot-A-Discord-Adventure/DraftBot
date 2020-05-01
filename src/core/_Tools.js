const DefaultValues = require('data/text/DefaultValues');
const ServerManager = require('../core/ServerManager');
const Config = require('../utils/Config');
const InventoryManager = require('../core/InventoryManager');

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
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @returns {Number} - the number refering to a rarity (1 - 8)
 */
const generateRandomrarity = function () {
    let randomValue = Math.round(Math.random() * DefaultValues.raritiesGenerator.maxValue);
    let result;
    if (randomValue <= DefaultValues.raritiesGenerator['0']) {
        result = 1;
    } else if (randomValue <= DefaultValues.raritiesGenerator['1']) {
        result = 2;
    } else if (randomValue <= DefaultValues.raritiesGenerator['2']) {
        result = 3;
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
};

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

/**
 * Return the id list of all the users of a server
 * @param {*} message the message used to retrieve the server
 */
const getIdListServMember = function (message) {
    let idlist = ""
    message.guild.members.forEach(member => idlist += member.id + ",");
    return idlist.substring(0, idlist.length - 1);

}

//Exports
module.exports = {
    getIdListServMember,
    convertHoursInMiliseconds,
    convertMinutesInMiliseconds,
    convertMillisecondsInMinutes,
    displayDuration,
    generateRandomNumber,
    chargeText,
    detectLanguage,
    addItemBonus,
    seeItemBonus,
    generateRandomrarity
};
