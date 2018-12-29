/**
 * Represent the things that could happen after an event
 */
class Possibility {

    constructor(idEvent, emoji, id, timeLost, healthPointsChange, newEffect, xpGained, moneyGained) {
        this.idEvent = idEvent;
        this.emoji = emoji;
        this.id = id;
        this.timeLost = timeLost;
        this.healthPointsChange = healthPointsChange;
        this.newEffect = newEffect;
        this.xpGained = xpGained;
        this.moneyGained = moneyGained;
    }


}

module.exports = Possibility;