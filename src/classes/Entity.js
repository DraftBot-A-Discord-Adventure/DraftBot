const Tools = require('../utils/Tools');
const ServerManager = require('../classes/ServerManager');
const Config = require('../utils/Config');
let Text;

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
        if (maxHealth > 0) {
            this.maxHealth = maxHealth;
        }
    }

    /**
     * Returns this Entity's maximum health value.
     * @returns {Number} - How much health this Entity can have.
     */
    getMaxHealth() {
        return this.maxHealth;
    }

    /**
     * Set the Entity's current health value.
     * @param health - The new amount of health this Entity has. Must be a positive or null Number.
     */
    setHealth(health) {
        if (health >= 0) {
            this.health = health;
        }
    }

    /**
     * Returns the current amount of health this Entity has.
     * @returns {Number} - The current amount of health this Entity has.
     */
    getHealth() {
        return this.health;
    }

    /**
     * Returns this Entity's Physical/Ranged Attack value.
     * @returns {Number} - How strong are this Entity's Physical/Ranged Attacks.
     */
    getAttack() {
        return this.attack;
    }

    /**
     * Set this Entity's Physical/Ranged Attack value.
     * @param attack - How strong this Entity's Physical/Ranged Attacks should be. Must be a positive or null Number.
     */
    setAttack(attack) {
        if (attack >= 0) {
            this.attack = attack;
        }
    }

    /**
     * Returns this Entity's Defense value.
     * @returns {Number} - How resistant to Physical/Ranged Attacks this Entity is.
     */
    getDefense() {
        return this.defense;
    }

    /**
     * Set this Entity's Physical/Ranged Defense value.
     * @param defense - How resistant to Physical/Ranged Attacks this Entity should be. Must be a positive or null Number.
     */
    setDefense(defense) {
        if (defense >= 0) {
            this.defense = defense;
        }
    }

    /**
     * Returns this Entity's Speed value.
     * @returns {Number} - How rapid this Entity is.
     */
    getSpeed() {
        return this.speed;
    }

    /**
     * Set this Entity's Speed value.
     * @param speed - How rapid this Entity should be. Must be a positive or null Number.
     */
    setSpeed(speed) {
        if (speed > 0) {
            this.speed = speed;
        }
    }


    /**
    *  Allow to restore all the health of the entity
    */
    restoreHealthCompletely() {
        this.health = this.maxHealth
    }

    /**
     * Removes the specified amount of points from the entity's health. If the health of the entity is below 0, kill the entity.
     * Note: If points is negative, then addScore is called.
     * @see addHealthPoints
     * @param points - The amount of health points to remove. Must be a Number.
     * @param message  - The message that caused the heath change
     */
    removeHealthPoints(points, message, language) {
        if (points >= 0) {
            this.health -= parseInt(points);
            if (this.health <= 0) {
                this.kill(message, language)
            }
        } else {
            this.addHealthPoints(-points, message, language);
        }
    }


    /**
     * add the specified amount of points from the entity's health. If the health is higher than the maximum, set the health at the limit
     * Note: If points is negative, then removeScore is called.
     * @see removeHealthPoints
     * @param points - The amount of health points to add. Must be a Number.
     * @param message  - The message that caused the heath change
     */

     addHealthPoints(points, message, language) {
        if (points >= 0) {
            this.health += parseInt(points);
            if (this.health > this.maxHealth) {
                this.restoreHealthCompletely()
            }
        } else {
            this.removeHealthPoints(-points, message, language);
        }
    }

    /**
     * Returns the current state of the player
     * @returns {String} - The effect that affect the player
     */
    getEffect() {
        return this.effect;
    }

    /**
     * edit the state of a player
     * @param {String} - The new effect
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
    * @param {*} message - The message that caused the death of the player
    */
    kill(message, language) {
        Text = require('../text/' + language);
        this.setEffect(":skull:");
        this.setHealth(0);
        message.channel.send(Text.entity.killPublicIntro + message.author.username + Text.entity.killPublicMessage)
        message.author.send(Text.entity.killMessage)
    }

}

module.exports = Entity;