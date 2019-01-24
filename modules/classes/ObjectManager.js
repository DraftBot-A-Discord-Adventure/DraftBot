const Object = require('./Object');
const ItemNames = require('../utils/items/Francais');
const ItemValues = require('../utils/items/Values');
const Text = require('../text/Francais');

class ObjectManager {


    /**
     * Return an object matching with the piece of object that own a specific id
     * @param id - The id of the object that has to be loaded
     * @returns {*} - An object
     */
    getObjectById(id) {
        return new Object(id, ItemValues.object[id].rareness, ItemValues.object[id].power, ItemValues.object[id].nature);
    }


    /**
     * Return string containing a description of an object
     * @param object - The object that has to be displayed
     * @returns {String} - The description of the object
     */
    displayObject(object) {
        console.log(object);
        let stringResult = ItemNames.object[object.id] + Text.objectManager.separator + Text.rarities[object.rareness] + Text.objectManager.separator + Text.nature.intro[object.natureEffect];
        if (object.natureEffect != 0) { // affichage de la puissance de l'effet si il existe
            stringResult += object.power + Text.nature.outroObject[object.natureEffect];
        }
        return stringResult;
    }


    /**
     * Return string containing a description of an object in case this object is the default armor
     * @param object - The object that has to be displayed
     * @returns {String} - The description of the object
     */
    displayDefaultObject(object) {
        return ItemNames.object[object.id];
    }


}

module.exports = ObjectManager;