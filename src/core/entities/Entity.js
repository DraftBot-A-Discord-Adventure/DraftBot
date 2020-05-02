const EntityAbstract = require("entities/EntityAbstract");

/**
 * @property {String} id
 * @property {Number} maxHealth
 * @property {Number} health
 * @property {Number} attack
 * @property {Number} defense
 * @property {Number} speed
 * @property {String} effect
 */
class Entity extends EntityAbstract {

    /**
     * @param {String} id
     * @param {Number} maxHealth
     * @param {Number} health
     * @param {Number} attack
     * @param {Number} defense
     * @param {Number} speed
     * @param {String} effect
     */
    constructor({id, maxHealth, health, attack, defense, speed, effect}) {
        super();
        this.id = id;
        this.maxHealth = maxHealth;
        this.health = health;
        this.attack = attack;
        this.defense = defense;
        this.speed = speed;
        this.effect = effect;
    }

    // TODO 2.0 Legacy code
    // /**
    //  * Set the Entity's maximum health value.
    //  * @param maxHealth - The new maximum amount of health this Entity can have. Must be a positive Number.
    //  */
    // setMaxHealth(maxHealth) {
    //     if (maxHealth > 0) {
    //         this.maxHealth = maxHealth;
    //     }
    // }
    //
    // /**
    //  * Set the Entity's current health value.
    //  * @param health - The new amount of health this Entity has. Must be a positive or null Number.
    //  */
    // setHealth(health) {
    //     if (health >= 0) {
    //         this.health = health;
    //     }
    // }
    //
    // /**
    //  * Set this Entity's Physical/Ranged Attack value.
    //  * @param attack - How strong this Entity's Physical/Ranged Attacks should be. Must be a positive or null Number.
    //  */
    // setAttack(attack) {
    //     if (attack >= 0) {
    //         this.attack = attack;
    //     }
    // }
    //
    // /**
    //  * Set this Entity's Physical/Ranged Defense value.
    //  * @param defense - How resistant to Physical/Ranged Attacks this Entity should be. Must be a positive or null Number.
    //  */
    // setDefense(defense) {
    //     if (defense >= 0) {
    //         this.defense = defense;
    //     }
    // }
    //
    // /**
    //  * Set this Entity's Speed value.
    //  * @param speed - How rapid this Entity should be. Must be a positive or null Number.
    //  */
    // setSpeed(speed) {
    //     if (speed > 0) {
    //         this.speed = speed;
    //     }
    // }
    //
    // /**
    //  * Removes the specified amount of points from the entity's health. If the health of the entity is below 0, kill the entity.
    //  * Note: If points is negative, then addScore is called.
    //  * @see addHealthPoints
    //  * @param points - The amount of health points to remove. Must be a Number.
    //  * @param message  - The message that caused the heath change
    //  */
    // removeHealthPoints(points, message, language) {
    //     if (points >= 0) {
    //         this.health -= parseInt(points);
    //         if (this.health <= 0) {
    //             this.kill(message, language)
    //         }
    //     } else {
    //         this.addHealthPoints(-points, message, language);
    //     }
    // }
    //
    //
    // /**
    //  * add the specified amount of points from the entity's health. If the health is higher than the maximum, set the health at the limit
    //  * Note: If points is negative, then removeScore is called.
    //  * @see removeHealthPoints
    //  * @param points - The amount of health points to add. Must be a Number.
    //  * @param message  - The message that caused the heath change
    //  */
    //
    // addHealthPoints(points, message, language) {
    //     if (points >= 0) {
    //         this.health += parseInt(points);
    //         if (this.health > this.maxHealth) {
    //             this.restoreHealthCompletely()
    //         }
    //     } else {
    //         this.removeHealthPoints(-points, message, language);
    //     }
    // }
    //
    // /**
    //  * Check if a player si alive or not
    //  *@returns {boolean} - Trus if the player is dead
    //  */
    // isDead() {
    //     return this.effect === ":skull:";
    // }
    //
    // /**
    //  * kill a player
    //  * @param {*} message - The message that caused the death of the player
    //  */
    // kill(message, language) {
    //     Text = require('../text/' + language);
    //     this.setEffect(":skull:");
    //     this.setHealth(0);
    //     message.channel.send(Text.entity.killPublicIntro + message.author.username + Text.entity.killPublicMessage)
    //     message.author.send(Text.entity.killMessage)
    // }

}

module.exports = Entity;
