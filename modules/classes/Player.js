const Config = require('../utils/Config');
const Entity = require('./Entity');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues')

/**
 * Represents a Player.
 */
class Player extends Entity {

    constructor(maxHealth, health, attack, defense, speed, discordId, score, level, experience, money, effect, lastReport, badges, rank) {
        super(discordId, maxHealth, health, attack, defense, speed, effect);
        this.discordId = discordId;
        this.score = score;
        this.level = level;
        this.experience = experience;
        this.money = money;
        this.lastReport = lastReport;
        this.badges = badges;
        this.rank = rank
    }


    /**
     * Returns the amount of experience needed to level up. The formula for the amount of experience is:
     * f(level) = 75 * level ^ 1.35, where 75 and 1.35 are constants defined in NumberConstants.js.
     * @see NumberConstants
     * @returns {Number} Returns the experience needed to level up.
     */
    getExperienceToLevelUp() {
        return Math.round(Config.PLAYER_BASE_EXPERIENCE_PER_LEVEL *
            Math.pow(this.level, Config.PLAYER_BASE_EXPERIENCE_RATIO));
    }

    /**
     * Add the specified amount of experience to the player's experience total. If it allows the Player to
     * level up, the levelUp function will be called.
     * @see levelUp
     * @param experience - The amount of experience to add. Must be a positive Number.
     */
    addExperience(experience) {
        if (Tools.isAPositiveNumber(experience)) {
            this.setExperience(this.experience + parseInt(experience));
            if (this.hasEnoughExperienceToLevelUp()) {
                this.levelUp();
            }
        }
    }

    /**
     * Returns this Player instance's current experience.
     * @returns {Number} - The amount of experience this Player instance currently has.
     */
    getExperience() {
        return this.experience;
    }

    /**
     * Set this Player instance's current experience.
     * @param experience - The amount of experience this instance should have. Must be a positive or null Number.
     */
    setExperience(experience) {
        if (Tols.isAPositiveNumberOrNull(experience)) {
            this.experience = experience;
            if (this.hasEnoughExperienceToLevelUp()) {
                this.levelUp();
            }
        }
    }

    /**
     * Returns this Player instance's current experience.
     * @returns {Number} - The level of this Player instance.
     */
    getLevel() {
        return this.level;
    }

    /**
     * Set this Player instance's level.
     * @param level - The level this Player instance should be. Must be a positive Number.
     */
    setLevel(level) {
        if (Tools.isAPositiveNumber(level)) {
            this.level = level;
        }
    }

    /**
     * Increments the Player's level, and subtract the experience needed for the level up from the Player's
     * experience.
     */
    levelUp() {
        this.setExperience(this.getExperience() - this.getExperienceToLevelUp());
        this.setLevel(this.getLevel() + 1);
    }

    /**
     * Add the specified amount of money to the Player's wallet.
     * Note: If money is negative, then removeMoney is called.
     * @see removeMoney
     * @param money - The amount of money to add. Must be a Number.
     */
    addMoney(money) {
        if (Tools.isAPositiveNumberOrNull(money)) {
            this.money += parseInt(money);
        } else {
            this.removeMoney(-money);
        }
    }

    /**
     * Removes the specified amount of money from the Player's wallet.
     * Note: If money is negative, then addMoney is called.
     * @see addMoney
     * @param money - The amount of money to remove. Must be a Number.
     */
    removeMoney(money) {
        if (Tools.isAPositiveNumberOrNull(money)) {
            this.money -= parseInt(money);
        } else {
            this.addMoney(-money);
        }
    }

    /**
     * Set this Player instance's currently held amount of money.
     * @param money - The amount of money this Player instance should have. Must be a positive or null Number.
     */
    setMoney(money) {
        if (Tools.isAPositiveNumberOrNull(money)) {
            this.money = money;
        }
    }

    /**
     * Returns this Player instance's currently held money.
     * @returns {Number} - The amount of money held by this Player instance.
     */
    getMoney() {
        return this.money;
    }


    /**
     * Changes the last Report time of a player
     * @param lastReport - The Player's new lastReport.
     */
    setLastReport(lastReport) {
        this.lastReport = lastReport;
    }


    /**
     * Returns this Player instance's currently lastReport.
     * @returns {Number} - The lastReport of this Player instance.
     */
    getLastReport() {
        return this.lastReport;
    }


    /**
     * Returns whether the Player has enough experience to level up or not.
     * @returns {boolean} True if the player has the needed amount of experience to level up, false otherwise.
     */
    hasEnoughExperienceToLevelUp() {
        return (this.experience >= this.getExperienceToLevelUp());
    }


    /**
     * Changes the name of the Player.
     * @param name - The Player's new name.
     */
    setName(name) {
        this.name = name;
    }


    /**
     * Returns this Player instance's name.
     * @returns {String} - The name of this Player instance.
     */
    getName() {
        return this.name;
    }

    /**
     * Changes the Player's Discord ID. Should be called once by instance lifetime in practice.
     * @param discordId - The Discord User ID to assign to the player.
     */
    setDiscordId(discordId) {
        if (Tools.isANegativeNumber(this.discordId)) {
            this.discordId = discordId;
        }
    }

    /**
     * Returns the Discord User ID associated to this Player instance.
     * @returns {number|*} - The Discord User ID associated to this Player instance.
     */
    getDiscordId() {
        return this.discordId;
    }

    /**
     * Returns the score of the player.
     * @returns {Number} - The score of the player
     */
    getScore() {
        return this.score;
    }


    /**
     * Returns the rank of the player.
     * @returns {Number} - The rank of the player
     */
    getRank() {
        return this.rank;
    }


    /**
     * Update the timecode matching the last time the player has been see
     * @param {Number} time - The timecode to set
     * @param {Number} malusTime - A malus that has to be added to the lasReportTime
     * @param {String} effectMalus - The current effect of the player in case it gave an other malus
     */
    updateLastReport(time, malusTime, effectMalus) {
        let realMalus = DefaultValues.effectMalus[effectMalus];
        this.lastReport = parseInt(time) + parseInt(Tools.convertMinutesInMiliseconds(malusTime)) + parseInt(realMalus);
    }


    /**
     * Removes the specified amount of points from the Player's score.
     * Note: If points is negative, then addScore is called.
     * @see addScore
     * @param points - The amount of points to remove. Must be a Number.
     */
    removeScore(points) {
        if (Tools.isAPositiveNumberOrNull(points)) {
            this.score -= parseInt(points);
        } else {
            this.addScore(-points);
        }
    }


    /**
     * add the specified amount of points from the Player's score.
     * Note: If points is negative, then removeScore is called.
     * @see removeScore
     * @param points - The amount of points to add. Must be a Number.
     */
    addScore(points) {
        if (Tools.isAPositiveNumberOrNull(points)) {
            this.score += parseInt(points);
        } else {
            this.removeScore(-points);
        }
    }

    /**
     * Calculate the time difference in minute betwin now and the last time the player has been seen
     * @param {Number} currentTime 
     * @returns {Number}
     */
    calcTime(currentTime) {
        let time = Math.floor((currentTime - this.lastReport) / (1000 * 60))
        if (time > DefaultValues.report.timeLimit) {
            time = DefaultValues.report.timeLimit;
        }
        return time
    }


}

module.exports = Player;