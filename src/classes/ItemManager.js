let ItemNames;

class ItemManager {

    /**
     * Returns the name of the item
     * @param {Item} item - The item
     * @param {String} language - The language
     * @returns {String} - The name of the item
     */
    getItemSimpleName(item, language) {
        ItemNames = require('../utils/items/' + language);
        switch (item.getType()) {
            case 'weapon':
                return ItemNames.weapon[item.getId()];
            case 'armor':
                return ItemNames.armor[item.getId()];
            case 'potion':
                return ItemNames.potion[item.getId()];
            case 'object':
                return ItemNames.object[item.getId()];
            default:
                return "Unknown item type: " + item.getType();
        }
    }
}

module.exports = ItemManager;