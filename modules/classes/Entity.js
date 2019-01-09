const TypeOperators = require('../utils/TypeOperators');

/**
 * Base class that shouldn't be instantiated. Instead, Entities are meant to extend this class.
 * Entities are things like Enemies, entitys...
 */
class Entity {

    constructor(id, maxHealth, health, attack, defense, speed, effect) {
        if (new.target === Entity) {
            throw new TypeError("Cannot instantiate Entity: Abstract Class");
        } else {
            this.id = id;
            this.maxHealth = maxHealth;
            this.health = health;
            this.attack = attack;
            this.defense = defense;
            this.speed = speed;
            this.effect = effect;
        }
    }

    /**
     * Set the Entity's maximum health value.
     * @param maxHealth - The new maximum amount of health this Entity can have. Must be a positive Number.
     */
    setMaxHealth(maxHealth) {
        if (TypeOperators.isAPositiveNumber(maxHealth)) {
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

    /**
    *  Allow to restore all the health of the entity
    */
    restoreHealthCompletely() {
        this.restoreHealthCompletely = this.maxHealth
    }

    /**
     * Removes the specified amount of points from the entity's health. If the health of the entity is below 0, kill the entity.
     * Note: If points is negative, then addScore is called.
     * @see addHealthPoints
     * @param points - The amount of health points to remove. Must be a Number.
     */
    removeHealthPoints(points) {
        if (TypeOperators.isAPositiveNumberOrNull(points)) {
            this.health -= points;
            if (TypeOperators.isANegativeOrNullNumber(this.health))
                this.kill()
        } else {
            this.addHealthPoints(-points);
        }
    }


    /**
     * add the specified amount of points from the entity's health. If the health is higher than the maximum, set the health at the limit
     * Note: If points is negative, then removeScore is called.
     * @see removeHealthPoints
     * @param points - The amount of health points to add. Must be a Number.
     */
    addHealthPoints(points) {
        if (TypeOperators.isAPositiveNumberOrNull(points)) {
            this.health += points;
            if (this.health>this.maxHealth)
            this.restoreHealthCompletely()
        } else {
            this.removeHealthPoints(-points);
        }
    }

    /**
     * Returns the current state of the player
     * @returns {string} - The effect that affect the player 
     */
    getEffect() {
        return this.effect;
    }

    /**
     * edit the state of a player
     * @param {string} - The new effect
     */
    setEffect(effect) {
        this.effect = effect;
    }

    /**
     * Check if a player si alive or not
     *@returns {boolean} - Trus if the player is dead
     */
    isDead() {
        return this.effect === ":skull:";
    }

     /**
     * kill a player
     */
    kill() {
        this.setEffect(":skull:");
        this.setHealth(0);
    }



}

module.exports = Entity;