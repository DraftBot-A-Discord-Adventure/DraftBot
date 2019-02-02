const Item = require('./Item');
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");


/**
 * Represent a potion
 */
class Potion extends Item {


    constructor(id, rareness, power,  natureEffect, numberOfUse) {
        super(id, rareness, power);
        this.natureEffect = natureEffect
        this.numberOfUse = numberOfUse
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