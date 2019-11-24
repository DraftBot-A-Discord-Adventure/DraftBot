const InventoryManager = require('../classes/InventoryManager');
const EquipementManager = require('../classes/EquipementManager');
const PotionManager = require('../classes/PotionManager');
const ObjectManager = require('../classes/ObjectManager');
const DefaultValues = require('../utils/DefaultValues');
const ServerManager = require('../classes/ServerManager');
let Text;

/**
 * Allow to charge the correct text file
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const chargeText = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    let address = '../text/' + server.language;
    return require(address);
}

/**
 * Allow to get the language the bot has to respond with
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 * @returns {string} - the code of the server language
 */
const detectLanguage = async function (message) {
    let serverManager = new ServerManager();
    let server = await serverManager.getServer(message);
    if (message.channel.id == 639446722845868101) {
        server.language = "en";
    }
    return server.language;
}


/**
 * Display the content of the inventory's inventory
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const inventoryCommand = async function (message) {
    Text = await chargeText(message);
    let inventoryManager = new InventoryManager();
    let inventory = await inventoryManager.getCurrentInventory(message);
    if (askForAnotherPlayer(args)) {
        let playerId;
        player = await getAskedPlayer(playerId, player, playerManager, message, args); //recupération de l'id du joueur demandé
        inventory = await inventoryManager.getInventoryById(playerId)
        if (askedPlayerIsInvalid(player))
            return message.channel.send(Text.commands.inventory.errorMain + message.author.username + Text.commands.inventory.errorInv)
    }
    let messageInventory = await generateInventoryMessage(message, inventory);
    message.channel.send(messageInventory);
}


/**
 * check if the user ask for its own profile or the one of someone else
 * @param {*} args - The args given by the user that made the command
 */
function askForAnotherPlayer(args) {
    return args[1] != undefined;
}


/**
 * Allow to recover the asked player if needed
 * @param {*} playerId - The asked id of the player
 * @param {*} player - The player that is asked for
 * @param {*} playerManager - The player manager
 * @param {*} message - The message that initiate the command

 */
async function getAskedPlayer(playerId, player, playerManager, message, args) {
    if (isNaN(args[1])) {
        try {
            playerId = message.mentions.users.last().id;
        } catch (err) { // the input is not a mention or a user rank
            playerId = "0"
        }
    } else {
        playerId = await playerManager.getIdByRank(args[1]);

    }
    player = await playerManager.getPlayerById(playerId, message);
    return player;
}


/**
 * Returns a string containing the inventory message.
 * @returns {String} - A string containing the inventory message.
 * @param message - The message that caused the function to be called. Used to retrieve the author of the message.
 */
const generateInventoryMessage = async function (message, inventory) {

    //chargement des managers
    let equipementManager = new EquipementManager();
    let potionManager = new PotionManager();
    let objectManager = new ObjectManager();

    //chargement des objets de l'inventaire
    let weapon = equipementManager.getWeaponById(inventory.weaponId);
    let armor = equipementManager.getArmorById(inventory.armorId);
    let object = objectManager.getObjectById(inventory.objectId);
    let objectBackup = objectManager.getObjectById(inventory.backupItemId);
    let potion = potionManager.getPotionById(inventory.potionId);

    //chargement de la langue
    let language = await detectLanguage(message);


    inventoryMessage = Text.commands.inventory.title + message.author.username + Text.commands.inventory.lineEnd1 +
        equipementManager.displayWeapon(weapon, language) + Text.commands.inventory.lineEnd2;
    if (inventory.armorId == DefaultValues.inventory.armor) { //the user doesnt have any armor or shield
        inventoryMessage += equipementManager.displayDefaultArmor(armor, language);
    } else { //the user have a armor
        inventoryMessage += equipementManager.displayArmor(armor, language);
    }
    inventoryMessage += Text.commands.inventory.lineEnd2;
    if (inventory.potionId == DefaultValues.inventory.potion) { //the user doesnt have any potion
        inventoryMessage += potionManager.displayDefaultPotion(potion, language);
    } else { //the user have a potion
        inventoryMessage += potionManager.displayPotion(potion, language);
    }
    inventoryMessage += Text.commands.inventory.lineEnd2;
    if (inventory.objectId == DefaultValues.inventory.object) { //the user doesnt have any object
        inventoryMessage += objectManager.displayDefaultObject(object, language);
    } else { //the user have an object
        inventoryMessage += objectManager.displayObject(object, language);
    }
    inventoryMessage += Text.commands.inventory.backupTitle;
    if (inventory.backupItemId == DefaultValues.inventory.object) { //the user doesnt have any object in the backup place
        inventoryMessage += objectManager.displayDefaultObject(objectBackup, language);
    } else { //the user have an object in the backup place
        inventoryMessage += objectManager.displayObject(objectBackup, language);
    }
    return inventoryMessage;
};

module.exports.InventoryCommand = inventoryCommand;
