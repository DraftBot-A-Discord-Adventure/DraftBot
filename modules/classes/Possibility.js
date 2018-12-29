/**
 * Represent the things that could happen after an event
 */
class Possibility {

    constructor(idEvent, emoji, id, timeLost, healthPointsLost, newEffect, xpGained, moneyGained) {
        this.idEvent = idEvent;
        this.emoji = emoji;
        this.id = id;
        this.timeLost = timeLost;
        this.healthPointsLost = healthPointsLost;
        this.newEffect = newEffect;
        this.xpGained = xpGained;
        this.moneyGained = moneyGained;
    }


}

module.exports = Possibility;