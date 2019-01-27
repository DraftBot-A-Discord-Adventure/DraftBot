const Equipement = require('../classes/Equipement');
const DefaultValues = require('../utils/DefaultValues');
const ItemNames = require('../utils/Items/Francais.json');
const ItemValues = require('../utils/Items/Values.json');
const InventoryManager = require('../classes/InventoryManager');
const EquipementManager = require('../classes/EquipementManager');
const PotionManager = require('../classes/PotionManager');
const ObjectManager = require('../classes/ObjectManager');
const Text = require('../text/Francais');
const PlayerManager = require('../classes/PlayerManager')


/**
 * Display the content of the inventory's inventory
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const testCommand = async function (message, args) {
    let rarities = {
        "1": "0",
        "2": "0",
        "3": "0",
        "4": "0",
        "5": "0",
        "6": "0",
        "7": "0"
    }
    let equipementManager = new EquipementManager()
    for (let index = 0; index < args[1]; index++) {
        let test = equipementManager.generateRandomRareness()
        rarities[test]++
    }
    for (let index = 1; index < 8; index++) {
        message.channel.send(index + " : " + rarities[index]);
    }
}


module.exports.TestCommand = testCommand;