const Item = require('./Item');
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");

/**
 * Represent an object
 */
class Object extends Item {


    constructor(name, rareness, power, effectDescription, natureEffect) {
        super(name, rareness, power);
        this.effectDescription = effectDescription
        this.natureEffect = natureEffect
    }


    /**
     * Returns a description that explain what the object do
     * @returns {String} - The description of the effect
     */
    getEffectDescription() {
        return this.name;
    }


    /**
     * a number that match with an id of the effect applied by the object
     * @returns {number} - The id of the effect.
     */
    getNatureEffect() {
        return this.natureEffect;
    }
}

module.exports = Object;