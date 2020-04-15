const Equipement = require('./Equipement');
const ItemValues = require('../utils/items/Values');
const DefaultValues = require('../utils/DefaultValues');
const Tools = require('../utils/Tools');

let ItemNames;
let Text;

class EquipementManager {


    /**
     * Return an object matching with the piece of equipement that own a specific id
     * @param id - The id of the equipement that has to be loaded
     * @returns {*} - An equipement
     */
    getWeaponById(id) {
        return new Equipement(id, ItemValues.weapon[id].rareness, ItemValues.weapon[id].power, 'weapon');
    }


    /**
     * Return an object matching with the piece of equipement that own a specific id
     * @param id - The id of the equipement that has to be loaded
     * @returns {*} - An equipement
     */
    getArmorById(id) {
        return new Equipement(id, ItemValues.armor[id].rareness, ItemValues.armor[id].power, 'armor');
    }


    /**
     * Return string containing a description of an equipement wich is a weapon
     * @param equipement - The equipement that has to be displayed
     * @param language - The language the object has to be displayed in
     * @returns {String} - The description of the equipement
     */
    displayWeapon(equipement, language) {
        Text = require('../text/' + language);
        ItemNames = require('../utils/items/' + language);
        let stringResult = ItemNames.weapon[equipement.id] + Text.equipementManager.separator1 + this.getEquipementEfficiency(equipement) + Text.equipementManager.separator2
            + Text.rarities[equipement.rareness];
        return stringResult;
    }


    /**
     * Return string containing a description of an equipement wich is a weapon
     * @param equipement - The equipement that has to be displayed
     * @param language - The language the object has to be displayed in
     * @returns {String} - The description of the equipement
     */
    displayArmor(equipement, language) {
        Text = require('../text/' + language);
        ItemNames = require('../utils/items/' + language);
        let stringResult = ItemNames.armor[equipement.id] + Text.equipementManager.separator1 + this.getEquipementEfficiency(equipement) + Text.equipementManager.separator2
            + Text.rarities[equipement.rareness];
        return stringResult;
    }


    /**
     * Return string containing a description of an equipement in case this equipement is the default armor
     * @param equipement - The equipement that has to be displayed
     * @param language - The language the object has to be displayed in
     * @returns {String} - The description of the equipement
     */
    displayDefaultArmor(equipement, language) {
        ItemNames = require('../utils/items/' + language);
        return ItemNames.armor[equipement.id];
    }


    /**
     * Return the real value of the power that is applied when it is used
     * @param equipement - The equipement that has to be displayed
     * @returns {Number} - The real power of a piece of equipement
     */
    getEquipementEfficiency(equipement) {
        return parseInt(ItemValues.effect[equipement.rareness][equipement.power]);
    }


    /**
     * Choose a random weapon in the existing ones. (take care of the rareness)
     * @returns {*} - A random weapon
     */
    generateRandomWeapon() {
        let desiredRareness = Tools.generateRandomRareness();
        let id = this.generateRandomWeaponId();
        let tries = 1;
        while (ItemValues.weapon[id].rareness != desiredRareness) {
            tries++;
            id = this.generateRandomWeaponId();
        }
        console.log("Item généré ! Nombre d'essais: " + tries);
        return this.getWeaponById(id);
    }


    /**
     * Generate an id of an existing weapon totally randomly without taking care of the rareness
     * @returns {Number} - A random Id
     */
    generateRandomWeaponId() {
        return Math.round(Math.random() * (DefaultValues.raritiesGenerator.numberOfWeapon - 1)) + 1;
    }


    /**
     * Choose a random armor in the existing ones. (take care of the rareness)
     * @returns {*} - A random armor
     */
    generateRandomArmor() {
        let desiredRareness = Tools.generateRandomRareness();
        let id = this.generateRandomArmorId();
        let tries = 1;
        while (ItemValues.armor[id].rareness != desiredRareness) {
            tries++;
            id = this.generateRandomArmorId();
        }
        console.log("Item généré ! Nombre d'essais: " + tries)
        return this.getArmorById(id);
    }


    /**
     * Generate an id of an existing armor totally randomly without taking care of the rareness
     * @returns {Number} - A random Id
     */
    generateRandomArmorId() {
        return Math.round(Math.random() * (DefaultValues.raritiesGenerator.numberOfArmor - 1)) + 1;
    }

}

module.exports = EquipementManager;
