const Potion = require('./Potion');
const ItemValues = require('../utils/items/Values');
const DefaultValues = require('../utils/DefaultValues');
const Tools = require('../utils/Tools');

let Text;
let ItemNames;


class PotionManager {


    /**
     * Return an potion matching with the piece of potion that own a specific id
     * @param id - The id of the potion that has to be loaded
     * @returns {*} - An potion
     */
    getPotionById(id) {
        return new Potion(id, ItemValues.potion[id].rareness, ItemValues.potion[id].power, ItemValues.potion[id].nature, ItemValues.potion[id].use);
    }


    /**
     * Return string containing a description of an potion
     * @param potion - The potion that has to be displayed
     * @param language - The language the object has to be displayed in
     * @returns {String} - The description of the potion
     */
    displayPotion(potion, language) {
        Text = require('../text/' + language);
        ItemNames = require('../utils/items/' +language);
        let stringResult = ItemNames.potion[potion.id] + Text.potionManager.separator + Text.rarities[potion.rareness] + Text.potionManager.separator + Text.nature.intro[potion.natureEffect];
        if (potion.natureEffect != 0) { // affichage de la puissance de l'effet si il existe
            stringResult += potion.power + Text.nature.outroPotion[potion.natureEffect];
        }
        return stringResult;
    }


    /**
     * Return string containing a description of an potion in case this potion is the default armor
     * @param potion - The potion that has to be displayed
     * @param language - The language the object has to be displayed in
     * @returns {String} - The description of the potion
     */
    displayDefaultPotion(potion,language) {
        ItemNames = require('../utils/items/' + language);
        return ItemNames.potion[potion.id];
    }


    /**
     * Choose a random potion in the existing ones. (take care of the rareness)
     * @returns {*} - A random potion
     */
    generateRandomPotion() {
        let desiredRareness = Tools.generateRandomRareness();
        let id = this.generateRandomPotionId();
        let tries = 1;
        while (ItemValues.potion[id].rareness != desiredRareness) {
            tries++;
            id = this.generateRandomPotionId();
        }
        console.log("Item généré ! Nombre d'essais: " + tries)
        return this.getPotionById(id);
    }

    /**
     * Generate an id of an existing potion totally randomly without taking care of the rareness
     * @returns {Number} - A random Id
     */
    generateRandomPotionId() {
        return Math.round(Math.random() * (DefaultValues.raritiesGenerator.numberOfPotion - 1)) + 1;
    }

    /**
     * Return the real value of the power that is applied when it is used
     * @param potion - The potion that has to be displayed
     * @returns {Number} - The real power of a piece of potion
     */
    getPotionEfficiency(potion) {
        return parseInt(potion.rareness);
    }
}

module.exports = PotionManager;