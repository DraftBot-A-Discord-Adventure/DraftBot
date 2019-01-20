const Item = require('./Item');
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");

/**
 * Represent a weapon or an armor
 */
class Equipement extends Item {

    constructor(id, name, rareness, power) {
        super(id, name, rareness, power);
    }

}

module.exports = Equipement;