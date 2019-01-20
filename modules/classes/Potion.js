const Item = require('./Item');
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");


/**
 * Represent a potion
 */
class Potion extends Item {


    constructor(id, name, rareness, power, effectDescription, natureEffect, numberOfUse) {
        super(id, name, rareness, power);
        this.effectDescription = effectDescription
        this.natureEffect = natureEffect
        this.numberOfUse = numberOfUse
    }


    /**
     * Returns a description that explain what the potion do
     * @returns {String} - The description of the effect
     */
    getEffectDescription() {
        return this.name;
    }

    /**
     * a number that match with an id of the effect applied by the potion
     * @returns {number} - The id of the effect.
     */
    getNatureEffect() {
        return this.natureEffect;
    }


    /**
     * the number of time the potion can be used before beeing deleted
     * @returns {number} - The number of use
     */
    getNumberOfUse() {
        return this.numberOfUse;
    }
}

module.exports = Potion;