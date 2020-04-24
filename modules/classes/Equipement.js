const Item = require('./Item');
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");

/**
 * Represent a weapon or an armor
 */
class Equipement extends Item {

    constructor(id, rareness, power, type) {
        super(id, rareness, power, type);
    }

}

module.exports = Equipement;