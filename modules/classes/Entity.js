const TypeOperators = require('../utils/TypeOperators');

/**
 * Base class that shouldn't be instantiated. Instead, Entities are meant to extend this class.
 * Entities are things like Enemies, Players...
 */
class Entity {
    
    constructor() {
        if (new.target === Entity) {
            throw new TypeError("Cannot instantiate Entity: Abstract Class");
        } else {
            this.maxHealth = 100;
            this.health = this.maxHealth;
            this.attack = 20;
            this.defense = 20;
            this.speed = 10;

        }
    }

    constructor(maxHealth,health,attack,defense,speed) {
        if (new.target === Entity) {
            throw new TypeError("Cannot instantiate Entity: Abstract Class");
        } else {
            this.maxHealth = maxHealth;
            this.health = health;
            this.attack = attack;
            this.defense = defense;
            this.speed = speed;

        }
    }

    /**
     * Set the Entity's maximum health value.
     * @param maxHealth - The new maximum amount of health this Entity can have. Must be a positive Number.
     */
    setMaxHealth(maxHealth) {
        if(TypeOperators.isAPositiveNumber(maxHealth)) {
            this.maxHealth = maxHealth;
        }
    }

    /**
     * Returns this Entity's maximum health value.
     * @returns {number} - How much health this Entity can have.
     */
    getMaxHealth() {
        return this.maxHealth;
    }

    /**
     * Set the Entity's current health value.
     * @param health - The new amount of health this Entity has. Must be a positive or null Number.
     */
    setHealth(health) {
        if (TypeOperators.isAPositiveNumberOrNull(health)) {
            this.health = health;
        }
    }

    /**
     * Returns the current amount of health this Entity has.
     * @returns {number} - The current amount of health this Entity has.
     */
    getHealth() {
        return this.health;
    }

    /**
     * Returns this Entity's Physical/Ranged Attack value.
     * @returns {number} - How strong are this Entity's Physical/Ranged Attacks.
     */
    getAttack() {
        return this.attack;
    }

    /**
     * Set this Entity's Physical/Ranged Attack value.
     * @param attack - How strong this Entity's Physical/Ranged Attacks should be. Must be a positive or null Number.
     */
    setAttack(attack) {
        if (TypeOperators.isAPositiveNumberOrNull(attack)) {
            this.magicAttack = attack;
        }
    }

    /**
     * Returns this Entity's Defense value.
     * @returns {number} - How resistant to Physical/Ranged Attacks this Entity is.
     */
    getDefense() {
        return this.defense;
    }

    /**
     * Set this Entity's Physical/Ranged Defense value.
     * @param defense - How resistant to Physical/Ranged Attacks this Entity should be. Must be a positive or null Number.
     */
    setDefense(defense) {
        if (TypeOperators.isAPositiveNumberOrNull(defense)) {
            this.defense = defense;
        }
    }


}

module.exports = Entity;