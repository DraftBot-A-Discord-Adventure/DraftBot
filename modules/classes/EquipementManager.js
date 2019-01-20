const Equipement = require('./Equipement');
const DefaultValues = require('../utils/DefaultValues')
const Config = require('../utils/Config')
const sql = require("sqlite");
const Tools = require('../utils/Tools');

sql.open("./modules/data/database.sqlite");

class EquipementManager{



}

module.exports = EquipementManager;