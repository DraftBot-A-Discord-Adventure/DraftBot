/**
 * Generate a random rareness. Legendary is very rare and common is not rare at all
 * @returns {number}
 */
const generateRandomRareness = function () {
    let randomValue = Math.round(Math.random() * Config.raritiesGenerator.maxValue);

    if (randomValue <= Config.raritiesGenerator['0']) {
        return 1;
    } else if (randomValue <= Config.raritiesGenerator['1']) {
        return 2;
    } else if (randomValue <= Config.raritiesGenerator['2']) {
        return 3;
    } else if (randomValue <= Config.raritiesGenerator['3']) {
        return 4;
    } else if (randomValue <= Config.raritiesGenerator['4']) {
        return 5;
    } else if (randomValue <= Config.raritiesGenerator['5']) {
        return 6;
    } else if (randomValue <= Config.raritiesGenerator['6']) {
        return 7;
    } else {
        return 8;
    }
};

module.exports = {
    generateRandomRareness
};
