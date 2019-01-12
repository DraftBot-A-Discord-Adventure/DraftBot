/**
 * Returns whether n is a Number AND is positive.
 * @param n - The object to test
 * @returns {boolean} - True if n is a Number AND is positive, false otherwise.
 */
const isAPositiveNumber = function (n) {
    return n > 0;
};

/**
 * Returns whether n is a Number AND is positive or null.
 * @param n - The object to test
 * @returns {boolean} - True if n is a Number AND is positive or null, false otherwise.
 */
const isAPositiveNumberOrNull = function (n) {
    return n >= 0;
};

/**
 * Returns whether n is a Number AND is negative.
 * @param n - The object to test
 * @returns {boolean} - True if n is a Number AND is negative, false otherwise.
 */
const isANegativeNumber = function (n) {
    return n < 0;
};

/**
 * Returns whether n is a Number AND is negative or null.
 * @param n - The object to test
 * @returns {boolean} - True if n is a Number AND is negative or null, false otherwise.
 */
const isANegativeOrNullNumber = function (n) {
    return n <= 0;
};

/**
 * Returns whether n is a Number AND is negative or null.
 * @param n - The object to test
 * @returns {boolean} - True if n is a Number AND is negative or null, false otherwise.
 */
const isANullNumber = function (n) {
    return n == 0;
};

/**
 * convert a number of minutes in a number of miliseconds
 * @param minutes - The number of minutes
 * @returns {Integer} - The number of miliseconds
 */
const convertMinutesInMiliseconds = function (minutes) {
    return minutes * 60000;
};


/**
 * convert a number of milliseconds in a number of minutes
 * @param miliseconds - The number of milliseconds
 * @returns {Integer} - The number of minutes
 */
const convertMillisecondsInMinutes = function (milliseconds) {
    return Math.round(milliseconds / 60000);
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
    if (isAPositiveNumber(heures))
       display += heures + " H ";
    display += minutes + " Min";
    return display
 };


//Exports
module.exports.isAPositiveNumber = isAPositiveNumber;
module.exports.isAPositiveNumberOrNull = isAPositiveNumberOrNull;
module.exports.isANegativeNumber = isANegativeNumber;
module.exports.isANegativeOrNullNumber = isANegativeOrNullNumber;
module.exports.isANullNumber = isANullNumber;
module.exports.convertMinutesInMiliseconds = convertMinutesInMiliseconds;
module.exports.convertMillisecondsInMinutes = convertMillisecondsInMinutes;
module.exports.displayDuration = displayDuration;

