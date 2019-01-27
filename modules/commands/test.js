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

    let playerManager = new PlayerManager()
    playerManager.giveRandomItem(message)

}


module.exports.TestCommand = testCommand;