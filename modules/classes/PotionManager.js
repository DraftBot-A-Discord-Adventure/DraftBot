const Potion = require('./Potion');
const ItemNames = require('../utils/items/Francais');
const ItemValues = require('../utils/items/Values');
const Text = require('../text/Francais');


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
     * @returns {String} - The description of the potion
     */
    displayPotion(potion) {
        console.log(potion);
        let stringResult = ItemNames.potion[potion.id] + Text.potionManager.separator + Text.rarities[potion.rareness] + Text.potionManager.separator + Text.nature.intro[potion.natureEffect];
        if (potion.natureEffect != 0) { // affichage de la puissance de l'effet si il existe
            stringResult += potion.power + Text.nature.outroPotion[potion.natureEffect];
        }
        stringResult +=  Text.potionManager.use + potion.numberOfUse
        return stringResult;
    }


    /**
     * Return string containing a description of an potion in case this potion is the default armor
     * @param potion - The potion that has to be displayed
     * @returns {String} - The description of the potion
     */
    displayDefaultPotion(potion) {
        return ItemNames.potion[potion.id];
    }


}

module.exports = PotionManager;