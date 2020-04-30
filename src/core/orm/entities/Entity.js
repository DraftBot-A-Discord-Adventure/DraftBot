const EntityAbstract = require("entities/EntityAbstract");

class Entity extends EntityAbstract {

    constructor(id, maxHealth, health, attack, defense, speed, effect) {
        super();
        this.id = id;
        this.maxHealth = maxHealth;
        this.health = health;
        this.attack = attack;
        this.defense = defense;
        this.speed = speed;
        this.effect = effect;
    }

    // TODO

}

module.exports = Entity;
