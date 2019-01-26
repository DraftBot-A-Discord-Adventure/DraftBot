const Equipement = require('../classes/Equipement');
const DefaultValues = require('../utils/DefaultValues');
const ItemNames = require('../utils/Items/Francais.json');
const ItemValues = require('../utils/Items/Values.json');
const InventoryManager = require('../classes/InventoryManager');
const EquipementManager = require('../classes/EquipementManager');
const PotionManager = require('../classes/PotionManager');
const ObjectManager = require('../classes/ObjectManager');
const Text = require('../text/Francais');


/**
 * Display the content of the inventory's inventory
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const testCommand = async function (message) {
    let equipementManager = new EquipementManager();
    let test = 0
    for (let index = 0; index < 200000000; index++) {
        let result = equipementManager.generateRandomWeapon()
        if (result > test) {
            test = result;
            message.channel.send("Nouveau record ! "+ test + " iteration numéro : " + index)
        }
    }
message.channel.send("fin : " + test);
}


module.exports.TestCommand = testCommand;