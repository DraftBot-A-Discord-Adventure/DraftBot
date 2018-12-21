/**
 * Returns whether n is a Number or not.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number, false otherwise.
 */
const isANumber = function(n) {
    return typeof n === 'number';
};

/**
 * Returns whether n is a Number AND is positive.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number AND is positive, false otherwise.
 */
const isAPositiveNumber = function(n) {
    return isANumber(n) && n > 0;
};

/**
 * Returns whether n is a Number AND is positive or null.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number AND is positive or null, false otherwise.
 */
const isAPositiveNumberOrNull = function(n) {
    return isANumber(n) && n >= 0;
};

/**
 * Returns whether n is a Number AND is negative.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number AND is negative, false otherwise.
 */
const isANegativeNumber = function(n) {
    return isANumber(n) && n < 0;
};

/**
 * Returns whether n is a Number AND is negative or null.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number AND is negative or null, false otherwise.
 */
const isANegativeOrNullNumber = function(n) {
    return isANumber(n) && n <= 0;
};

/**
 * Returns whether n is a string or not.
 * @param s - The object to test
 * @returns {boolean} True if s is a string, false otherwise.
 */
const isAString = function(s) {
    return typeof s === 'string';
};

/**
 * Returns whether player is an instance of a Player or not.
 * @param player - The object to test
 */
const isAPlayer = function(player) {
    return player.constructor.name === 'Player';
};

//Exports
module.exports.isANumber = isANumber;
module.exports.isAPositiveNumber = isAPositiveNumber;
module.exports.isAPositiveNumberOrNull = isAPositiveNumberOrNull;
module.exports.isANegativeNumber = isANegativeNumber;
module.exports.isANegativeOrNullNumber = isANegativeOrNullNumber;
module.exports.isAString = isAString;
module.exports.isAPlayer = isAPlayer;
