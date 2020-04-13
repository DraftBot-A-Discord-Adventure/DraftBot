const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues');
let Text;

/**
 * Represents a Guild.
 */
class Guild {

    constructor(guildId, name, chief, score, level, experience, rank, lastInvocation) {
        this.guildId = guildId;
        this.name = name;
        this.chief = chief;
        this.score = score;
        this.level = level;
        this.experience = experience;
        this.rank = rank;
        this.lastInvocation = lastInvocation;
    }

    /**
     * Returns the amount of experience needed to level up. 
     * @see NumberConstants 
     * @returns {Number} Returns the experience needed to level up.
     */
    getExperienceToLevelUp() {
        let xpToLevelUp = DefaultValues.guildXp[parseInt(this.level + 1)];
        return xpToLevelUp;
    }

    /**
     * Returns the amount of experience used to level up. 
     * @see NumberConstants
     * @returns {Number} Returns the experience used to level up.
     */
    getExperienceUsedToLevelUp() {
        let xpToLevelUp = DefaultValues.guildXp[this.level];
        if (this.level > 100)
            xpToLevelUp = 100;
        return xpToLevelUp;
    }


    /**
     * Add the specified amount of experience to the Guild's experience total. If it allows the Guild to
     * level up, the levelUp function will be called.
     * @see levelUp
     * @param {Number} experience - The amount of experience to add. Must be a positive Number.
     * @param {*} message - The message that caused the xp gain
     */
    addExperience(experience, message, language) {
        if (Tools.isAPositiveNumber(experience)) {
            this.setExperience(this.experience + parseInt(experience), message, language);
        }
    }

    /**
     * Returns this Guild instance's current experience.
     * @returns {Number} - The amount of experience this Guild instance currently has.
     */
    getExperience() {
        return this.experience;
    }

    /**
     * Set this Guild instance's current experience.
     * @param experience - The amount of experience this instance should have. Must be a positive or null Number.
     * @param {*} message - The message that caused the levelup. Used to send a level up message
     */
    setExperience(experience, message, language) {
        if (Tools.isAPositiveNumberOrNull(experience)) {
            this.experience = experience;
            if (this.hasEnoughExperienceToLevelUp()) {
                this.levelUp(message, language);
            }
        }
    }

    /**
     * Returns this Guild instance's current experience.
     * @returns {Number} - The level of this Guild instance.
     */
    getLevel() {
        return this.level;
    }

    /**
     * Set this Guild instance's level.
     * @param {Number} level - The level this Guild instance should be. Must be a positive Number.
     */
    setLevel(level) {
        if (Tools.isAPositiveNumber(level)) {
            this.level = level;
        }
    }

    /**
     * Increments the Guild's level, and subtract the experience needed for the level up from the Guild's
     * experience.
     * @param {*} message - The message that caused the levelup. Used to send a level up message
     */
    levelUp(message, language) {
        Text = require('../text/' + language);
        this.setLevel(this.getLevel() + 1);
        let messageLevelUp = Text.GuildManager.levelUp.intro + message.author + Text.GuildManager.levelUp.main + this.getLevel() + Text.GuildManager.levelUp.end;
        let bonus = false;
        if (this.getLevel() == DefaultValues.fight.minimalLevel) {
            messageLevelUp += Text.GuildManager.levelUp.fightUnlocked;
            bonus = true;
        }
        if (this.getLevel() % 10 == 0) {
            this.restoreHealthCompletely();
            messageLevelUp += Text.GuildManager.levelUp.healthRestored;
            bonus = true;
        } else {
            if (this.getLevel() % 5 == 0) {
                this.setMaxHealth(this.getMaxHealth() + 5);
                this.addHealthPoints(5, message, language);
                messageLevelUp += Text.GuildManager.levelUp.moreMaxHealth;
                bonus = true;
            }
        }

        if (this.getLevel() % 9 == 0) {
            this.setSpeed(this.getSpeed() + 5);
            if (bonus == false) {
                messageLevelUp += Text.GuildManager.levelUp.firstBonus;
            }
            messageLevelUp += Text.GuildManager.levelUp.moreSpeed;
            bonus = true;
        } else {
            if (this.getLevel() % 6 == 0) {
                this.setAttack(this.getAttack() + 5);
                if (bonus == false) {
                    messageLevelUp += Text.GuildManager.levelUp.firstBonus;
                }
                messageLevelUp += Text.GuildManager.levelUp.moreAttack;
                bonus = true;
            } else {
                if (this.getLevel() % 3 == 0) {
                    this.setDefense(this.getDefense() + 5);
                    if (bonus == false) {
                        messageLevelUp += Text.GuildManager.levelUp.firstBonus;
                    }
                    messageLevelUp += Text.GuildManager.levelUp.moreDefense;
                    bonus = true;
                }
            }
        }

        if (bonus == false) {
            messageLevelUp += Text.GuildManager.levelUp.noBonus;
        }
        message.channel.send(messageLevelUp);
        this.setExperience(this.getExperience() - this.getExperienceUsedToLevelUp(), message, language);
    }

    /**
     * Returns whether the Guild has enough experience to level up or not.
     * @returns {boolean} True if the Guild has the needed amount of experience to level up, false otherwise.
     */
    hasEnoughExperienceToLevelUp() {
        return (this.experience >= this.getExperienceToLevelUp());
    }


    /**
     * Changes the name of the Guild.
     * @param name - The Guild's new name.
     */
    setName(name) {
        this.name = name;
    }

    /**
     * Returns this Guild instance's name.
     * @returns {String} - The name of this Guild instance.
     */
    getName() {
        return this.name;
    }


    /**
     * Returns this Guild instance's chief.
     * @returns {String} - The chief of this Guild instance.
     */
    getChief() {
        return this.chief;
    }

    
    /**
     * Changes the chief of the Guild.
     * @param name - The Guild's new chief.
     */
    setChief(chief) {
        this.chief = chief;
    }

    /**
     * Changes the Guild's Discord ID. Should be called once by instance lifetime in practice.
     * @param id - The ID to assign to the Guild.
     */
    setGuildId(guildId) {
        if (Tools.isANegativeNumber(this.guildId)) {
            this.guildId = guildId;
        }
    }

    /**
     * Returns the GuildId associated to this Guild instance.
     * @returns {number|*} - The GuildId associated to this Guild instance.
     */
    getGuildId() {
        return this.guildId;
    }

    /**
     * Returns the score of the Guild.
     * @returns {Number} - The score of the Guild
     */
    getScore() {
        return this.score;
    }

    /**
     * Returns the rank of the Guild.
     * @returns {Number} - The rank of the Guild
     */
    getRank() {
        return this.rank;
    }

    /**
     * Removes the specified amount of points from the Guild's score.
     * Note: If points is negative, then addScore is called.
     * @see addScore
     * @param points - The amount of points to remove. Must be a Number.
     */
    removeScore(points) {
        if (Tools.isAPositiveNumberOrNull(points)) {
            this.score -= parseInt(points);
            this.weeklyScore -= parseInt(points);
        } else {
            this.addScore(-points);
        }
    }

    /**
     * add the specified amount of points from the Guild's score.
     * Note: If points is negative, then removeScore is called.
     * @see removeScore
     * @param points - The amount of points to add. Must be a Number.
     */
    addScore(points) {
        if (Tools.isAPositiveNumberOrNull(points)) {
            this.score += parseInt(points);
            this.weeklyScore += parseInt(points);
        } else {
            this.removeScore(-points);
        }
    }

    /**
     * Calculate the time difference in minute betwin now and the last time the Guild has been seen
     * @param {Number} currentTime 
     * @returns {Number}
     */
    calcTime(currentTime) {
        let time = Math.floor((currentTime - this.lastReport) / (1000 * 60))
        if (time > DefaultValues.report.timeLimit) {
            time = DefaultValues.report.timeLimit;
        }
        return parseInt(time)
    }


}

module.exports = Guild;