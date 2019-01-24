const InventoryManager = require('../classes/InventoryManager');
const EquipementManager = require('../classes/EquipementManager');
const PotionManager = require('../classes/PotionManager');
const ObjectManager = require('../classes/ObjectManager');
const Text = require('../text/Francais');
const DefaultValues = require('../utils/DefaultValues')


/**
 * Display the content of the inventory's inventory
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const inventoryCommand = async function (message) {
    let inventoryManager = new InventoryManager();
    let inventory = await inventoryManager.getCurrentInventory(message);
    let messageInventory = generateInventoryMessage(message, inventory);
    message.channel.send(messageInventory);
}

/**
 * Returns a string containing the inventory message.
 * @returns {String} - A string containing the inventory message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateInventoryMessage = function (message, inventory) {
    console.log(inventory);
    let equipementManager = new EquipementManager();
    let potionManager = new PotionManager();
    let objectManager = new ObjectManager();
    let weapon = equipementManager.getWeaponById(inventory.weaponId);
    let armor = equipementManager.getArmorById(inventory.armorId);
    let object = objectManager.getObjectById(inventory.objectId);
    let objectBackup = objectManager.getObjectById(inventory.backupItemId);
    let potion = potionManager.getPotionById(inventory.potionId);
    inventoryMessage = Text.commands.inventory.title + message.author.username + Text.commands.inventory.lineEnd1 +
        equipementManager.displayEquipement(weapon) + Text.commands.inventory.lineEnd2;
    if (inventory.armorId == DefaultValues.inventory.armor) { //the user doesnt have any armor or shield
        inventoryMessage += equipementManager.displayDefaultArmor(armor);
    } else { //the user have a armor
        inventoryMessage += equipementManager.displayEquipement(armor);
    }
    inventoryMessage += Text.commands.inventory.lineEnd2;
    if (inventory.potionId == DefaultValues.inventory.potion) { //the user doesnt have any potion
        inventoryMessage += potionManager.displayDefaultPotion(potion);
    } else { //the user have a potion
        inventoryMessage += potionManager.displayPotion(potion);
    }
    inventoryMessage += Text.commands.inventory.lineEnd2;
    if (inventory.objectId == DefaultValues.inventory.object) { //the user doesnt have any object
        inventoryMessage += objectManager.displayDefaultObject(object);
    } else { //the user have an object
        inventoryMessage += objectManager.displayObject(object);
    }
    inventoryMessage += Text.commands.inventory.backupTitle;
    if (inventory.objectId == DefaultValues.inventory.object) { //the user doesnt have any object in the backup place
        inventoryMessage += objectManager.displayDefaultObject(objectBackup);
    } else { //the user have an object in the backup place
        inventoryMessage += objectManager.displayObject(objectBackup);
    }

    return inventoryMessage;
};

module.exports.InventoryCommand = inventoryCommand;