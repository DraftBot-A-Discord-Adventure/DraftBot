const Equipement = require('../classes/Equipement');
const DefaultValues = require('../utils/DefaultValues');
const ItemNames = require('../utils/Items/Francais.json');
const ItemValues = require('../utils/Items/Values.json');

/**
 * Display the content of the inventory's inventory
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const testCommand = async function (message) {
    let test = new Equipement("default",ItemNames.weapon["default"],ItemValues.weapon["default"].rareness,ItemValues.weapon["default"].power);
    console.log(test);
}


module.exports.TestCommand = testCommand;