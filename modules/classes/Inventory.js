const Config = require('../utils/Config');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues')

/**
 * Represents an Inventory.
 */
class Inventory {

    constructor(playerId, weapon, armor, potion, item, backupItem) {
        this.playerId = playerId;
        this.weapon = weapon;
        this.armor = armor;
        this.potion = potion;
        this.item = item;
        this.backupItem = backupItem;
    }

}