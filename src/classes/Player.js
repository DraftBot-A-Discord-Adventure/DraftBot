const Entity = require('./Entity');
const Tools = require('../utils/Tools');
const DefaultValues = require('../utils/DefaultValues');

let Text;

/**
 * Represents a Player.
 */
class Player extends Entity {

    constructor(maxHealth, health, attack, defense, speed, discordId, score, level, experience, money, effect, lastReport, badges, rank, weeklyScore, weeklyRank, guildId) {
        super(discordId, maxHealth, health, attack, defense, speed, effect);
        this.discordId = discordId;
        this.score = score;
        this.level = level;
        this.experience = experience;
        this.money = money;
        this.lastReport = lastReport;
        this.badges = badges;
        this.rank = rank
        this.weeklyScore = weeklyScore;
        this.weeklyRank = weeklyRank;
        this.guildId = guildId
    }

    /**
     * Returns the guild id
     */
    getGuildId() {
        return this.guildId;
    }

    /**
     * Set the guild id
     */
    setGuildId(newGuildId) {
        this.guildId = newGuildId;
    }

    /**
     * Returns the amount of experience needed to level up.
     * @see NumberConstants
     * @returns {Number} Returns the experience needed to level up.
     */
    getExperienceToLevelUp() {
        let xpToLevelUp = DefaultValues.xp[parseInt(this.level + 1)];
        return xpToLevelUp;
    }

    /**
     * Returns the amount of experience used to level up.
     * @see NumberConstants
     * @returns {Number} Returns the experience used to level up.
     */
    getExperienceUsedToLevelUp() {
        let xpToLevelUp = DefaultValues.xp[this.level];
        return xpToLevelUp;
    }


    /**
     * Add the specified amount of experience to the player's experience total. If it allows the Player to
     * level up, the levelUp function will be called.
     * @see levelUp
     * @param {Number} experience - The amount of experience to add. Must be a positive Number.
     * @param {*} message - The message that caused the xp gain
     */
    addExperience(experience, message, language) {
        if (experience > 0) {
            this.setExperience(this.experience + parseInt(experience), message, language);
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
     * @param {*} message - The message that caused the levelup. Used to send a level up message
     */
    setExperience(experience, message, language) {
        if (experience >= 0) {
            this.experience = experience;
            if (this.hasEnoughExperienceToLevelUp()) {
                this.levelUp(message, language);
            }
        }
    }

    /**
     * Returns this player instance's current fight power
     */
    getFightPower() {
        return this.maxHealth + this.level * 10;
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
     * @param {Number} level - The level this Player instance should be. Must be a positive Number.
     */
    setLevel(level) {
        if (level > 0) {
            this.level = level;
        }
    }

    /**
     * Increments the Player's level, and subtract the experience needed for the level up from the Player's
     * experience.
     * @param {*} message - The message that caused the levelup. Used to send a level up message
     */
    levelUp(message, language) {
        Text = require('../text/' + language);
        this.setLevel(this.getLevel() + 1);
        let messageLevelUp = Text.playerManager.levelUp.intro + message.author + Text.playerManager.levelUp.main + this.getLevel() + Text.playerManager.levelUp.end;
        let bonus = false;
        if (this.getLevel() == DefaultValues.fight.minimalLevel) {
            messageLevelUp += Text.playerManager.levelUp.fightUnlocked;
            bonus = true;
        }
        if (this.getLevel() % 10 == 0) {
            this.restoreHealthCompletely();
            messageLevelUp += Text.playerManager.levelUp.healthRestored;
            bonus = true;
        } else {
            if (this.getLevel() % 5 == 0) {
                this.setMaxHealth(this.getMaxHealth() + 5);
                this.addHealthPoints(5, message, language);
                messageLevelUp += Text.playerManager.levelUp.moreMaxHealth;
                bonus = true;
            }
        }

        if (this.getLevel() % 9 == 0) {
            this.setSpeed(this.getSpeed() + 5);
            messageLevelUp = this.ifFirstBonus(bonus, messageLevelUp);
            messageLevelUp += Text.playerManager.levelUp.moreSpeed;
            bonus = true;
        } else {
            if (this.getLevel() % 6 == 0) {
                this.setAttack(this.getAttack() + 5);
                messageLevelUp = this.ifFirstBonus(bonus, messageLevelUp);
                messageLevelUp += Text.playerManager.levelUp.moreAttack;
                bonus = true;
            } else {
                if (this.getLevel() % 3 == 0) {
                    this.setDefense(this.getDefense() + 5);
                    messageLevelUp = this.ifFirstBonus(bonus, messageLevelUp);
                    messageLevelUp += Text.playerManager.levelUp.moreDefense;
                    bonus = true;
                }
            }
        }
        messageLevelUp = this.ifFirstBonus(bonus, messageLevelUp);
        messageLevelUp += Text.playerManager.levelUp.noBonus;
        message.channel.send(messageLevelUp);
        this.setExperience(this.getExperience() - this.getExperienceUsedToLevelUp(), message, language);
    }

    /**
     * 
     * @param {*} bonus 
     * @param {*} messageLevelUp 
     */
    ifFirstBonus(bonus, messageLevelUp) {
        if (bonus == false) {
            messageLevelUp += Text.playerManager.levelUp.firstBonus;
        }
        return messageLevelUp;
    }

    /**
     * Add the specified amount of money to the Player's wallet.
     * Note: If money is negative, then removeMoney is called.
     * @see removeMoney
     * @param money - The amount of money to add. Must be a Number.
     */
    addMoney(money) {
        if (money >= 0) {
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
        if (money >= 0) {
            this.money -= parseInt(money);
            if (this.money < 0)
                this.money = 0;
        } else {
            this.addMoney(-money);
        }
    }

    /**
     * Set this Player instance's currently held amount of money.
     * @param money - The amount of money this Player instance should have. Must be a positive or null Number.
     */
    setMoney(money) {
        if (money >= 0) {
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
        if (this.discordId < 0) {
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
     * Returns the weekly score of the player.
     * @returns {Number} - The score of the player
     */
    getWeeklyScore() {
        return this.weeklyScore;
    }


    /**
     * Returns the rank of the player.
     * @returns {Number} - The rank of the player
     */
    getRank() {
        return this.rank;
    }


    /**
     * Returns the weekly rank of the player.
     * @returns {Number} - The rank of the player
     */
    getWeeklyRank() {
        return this.weeklyRank;
    }

    /**
     * Returns the badges of the player.
     * @returns {String} - The badges of the player
     */
    getBadges() {
        return this.badges;
    }

    /**
     * Add a badge to the player.
     * @param {String} - The badge
     */
    addBadge(badge) {
        if (!this.badges.includes(badge)) {
            if (this.badges.length === 0) {
                this.badges += badge;
            } else {
                this.badges += `-` + badge;
            }
            return true;
        } else {
            return false;
        }
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
     * get the username of a player
     * @param {*} client - The instance of the bot
     * @returns {String} - The username
     */
    getPseudo(client) {
        if (client.users.get(this.discordId) != null) {
            return client.users.get(this.discordId).username;
        }
        return null;
    }

    /**
     * Removes the specified amount of points from the Player's score.
     * Note: If points is negative, then addScore is called.
     * @see addScore
     * @param points - The amount of points to remove. Must be a Number.
     */
    removeScore(points) {
        if (points >= 0) {
            this.score -= parseInt(points);
            this.weeklyScore -= parseInt(points);
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
        if (points >= 0) {
            this.score += parseInt(points);
            this.weeklyScore += parseInt(points);
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
        return parseInt(time)
    }


}

module.exports = Player;