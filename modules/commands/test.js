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
const testCommand = async function (message) {
    for (let index = 0; index < 5; index++) {
        potionManager = new PotionManager()
        message.channel.send(potionManager.displayPotion(potionManager.generateRandomPotion()))
    }
}


module.exports.TestCommand = testCommand;