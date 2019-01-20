const Item = require('./Item');
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");

/**
 * Represent an object
 */
class Object extends Item {


    constructor(id, name, rareness, power, natureEffect) {
        super(id, name, rareness, power);
        this.natureEffect = natureEffect
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