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

    /**
     * @param {Number} value
     */
    addMaxHealth(value) {
        this.maxHealth += value;
        this.setMaxHealth(this.maxHealth);
    }

    /**
     * @param {Number} value
     */
    setMaxHealth(value) {
        if (value > 0) {
            this.maxHealth = value;
        }
    }

    /**
     * @param {Number} value
     */
    addHealth(value) {
        this.health += value;
        this.setHealth(this.health);
    }

    /**
     * @param {Number} value
     */
    setHealth(value) {
        if (value > 0) {
            if (value > this.maxHealth) {
                this.health = this.maxHealth;
            } else {
                this.health = value;
            }
        } else {
            this.health = 0;
            // this.kill(message, language); // TODO
        }
    }

    /**
     * TODO 2.0
     * kill a player
     * @param {*} message - The message that caused the death of the player
     */
    kill(message, language) {
        this.setEffect(":skull:");
        this.setHealth(0);
        message.channel.send(Text.entity.killPublicIntro + message.author.username + Text.entity.killPublicMessage)
        message.author.send(Text.entity.killMessage)
    }

}

module.exports = Entity;
