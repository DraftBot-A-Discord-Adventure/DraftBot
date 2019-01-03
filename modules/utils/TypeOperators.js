/**
 * Returns whether n is a Number AND is positive.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number AND is positive, false otherwise.
 */
const isAPositiveNumber = function(n) {
    return n > 0;
};

/**
 * Returns whether n is a Number AND is positive or null.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number AND is positive or null, false otherwise.
 */
const isAPositiveNumberOrNull = function(n) {
    return  n >= 0;
};

/**
 * Returns whether n is a Number AND is negative.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number AND is negative, false otherwise.
 */
const isANegativeNumber = function(n) {
    return n < 0;
};

/**
 * Returns whether n is a Number AND is negative or null.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number AND is negative or null, false otherwise.
 */
const isANegativeOrNullNumber = function(n) {
    return n <= 0;
};

/**
 * Returns whether n is a Number AND is negative or null.
 * @param n - The object to test
 * @returns {boolean} True if n is a Number AND is negative or null, false otherwise.
 */
const isANullNumber = function(n) {
    return n == 0;
};


//Exports
module.exports.isAPositiveNumber = isAPositiveNumber;
module.exports.isAPositiveNumberOrNull = isAPositiveNumberOrNull;
module.exports.isANegativeNumber = isANegativeNumber;
module.exports.isANegativeOrNullNumber = isANegativeOrNullNumber;
module.exports.isANullNumber = isANullNumber;

