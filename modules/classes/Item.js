const Config = require('../utils/Config');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues')

/**
 * Base class that shouldn't be instantiated. Instead, Items are meant to extend this class.
 * Items are things like Objects, weapons...
 */
class Item {

    constructor(name, rareness, power) {
        this.name = name;
        this.rareness = rareness;
        this.power = power;
    }

}