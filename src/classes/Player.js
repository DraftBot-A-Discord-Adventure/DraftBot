class Player extends Entity {

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
