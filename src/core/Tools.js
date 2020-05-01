/**
 * Generate a random rarity. Legendary is very rare and common is not rare at all
 * @returns {Number}
 */
global.generateRandomRarity = function () {
    let randomValue = Math.round(Math.random() * JsonReader.values.raritiesGenerator.maxValue);

    if (randomValue <= JsonReader.values.raritiesGenerator['0']) {
        return 1;
    } else if (randomValue <= JsonReader.values.raritiesGenerator['1']) {
        return 2;
    } else if (randomValue <= JsonReader.values.raritiesGenerator['2']) {
        return 3;
    } else if (randomValue <= JsonReader.values.raritiesGenerator['3']) {
        return 4;
    } else if (randomValue <= JsonReader.values.raritiesGenerator['4']) {
        return 5;
    } else if (randomValue <= JsonReader.values.raritiesGenerator['5']) {
        return 6;
    } else if (randomValue <= JsonReader.values.raritiesGenerator['6']) {
        return 7;
    }

    return 8;
};

/**
 * Convert a number of milliseconds in a number of minutes
 * @param {Number} milliseconds - The number of milliseconds
 * @return {Number}
 */
global.millisecondsToMinutes = function (milliseconds) {
    return Math.round(milliseconds / 60000);
};

/**
 * Return a string containing a proper display of a duration
 * @param {Number} minutes - The number of minutes to display
 * @return {String}
 */
global.minutesToString = function (minutes) {
    let hours = Math.floor(minutes / 60);
    minutes = minutes - (hours * 60);

    let display = (hours > 0) ? hours + " H " : "";
    display += minutes + " Min";
    if (hours >= 0 && minutes === 0) {
        display = "Quelques secondes..."; // TODO 2.0 Should be translated
    }
    return display;
};

const format = require('string-template');
