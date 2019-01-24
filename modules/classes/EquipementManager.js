const Equipement = require('./Equipement');
const ItemNames = require('../utils/items/Francais');
const ItemValues = require('../utils/items/Values');
const Text = require('../text/Francais');

class EquipementManager {


    /**
     * Return an object matching with the piece of equipement that own a specific id
     * @param id - The id of the equipement that has to be loaded
     * @returns {*} - An equipement
     */
    getWeaponById(id) {
        return new Equipement(id, ItemValues.weapon[id].rareness, ItemValues.weapon[id].power);
    }


    /**
     * Return an object matching with the piece of equipement that own a specific id
     * @param id - The id of the equipement that has to be loaded
     * @returns {*} - An equipement
     */
    getArmorById(id) {
        return new Equipement(id, ItemValues.armor[id].rareness, ItemValues.armor[id].power);
    }


    /**
     * Return string containing a description of an equipement
     * @param equipement - The equipement that has to be displayed
     * @returns {String} - The description of the equipement
     */
    displayEquipement(equipement) {
        return ItemNames.weapon[equipement.id] + Text.equipementManager.separator1 + equipement.power + Text.equipementManager.separator2
            + Text.rarities[equipement.rareness];
    }


    /**
     * Return string containing a description of an equipement in case this equipement is the default armor
     * @param equipement - The equipement that has to be displayed
     * @returns {String} - The description of the equipement
     */
    displayDefaultArmor(equipement) {
        return ItemNames.armor[equipement.id];
    }


}

module.exports = EquipementManager;