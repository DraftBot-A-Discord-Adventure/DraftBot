const Item = require('./Item');
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");

/**
 * Represent a weapon or an armor
 */
class Equipement extends Item {

    constructor(name, rareness, power) {
        super(name, rareness, power);
    }

}

module.exports = Equipement;