const Item = require('./Item');
const DefaultValues = require('../utils/DefaultValues')
const Config = require('../utils/Config')
const sql = require("sqlite");
const Tools = require('../utils/Tools');

sql.open("./modules/data/database.sqlite");

/**
 * Represent a weapon or an armor
 */
class Equipement extends Item {

    constructor(name, rareness, power) {
        super(name, rareness, power);
    }

}