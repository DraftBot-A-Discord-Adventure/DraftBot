const Item = require('./Item');
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");


/**
 * Represent a potion This is like a normal object but it can only be used one time
 */
class Potion extends Item {


    constructor(id, rareness, power,  natureEffect) {
        super(id, rareness, power);
        this.natureEffect = natureEffect;
    }


    /**
     * A number that match with an id of the effect applied by the potion
     * @returns {number} - The id of the effect.
     */
    getNatureEffect() {
        return this.natureEffect;
    }
}

module.exports = Potion;