const Player = require('./Player');
const DefaultValues = require('../utils/DefaultValues')
const Config = require('../utils/Config')
const sql = require("sqlite");

sql.open("./modules/data/database.sqlite");

class PlayerManager {

    /**
    * Return a promise that will contain the player that sent a message once it has been resolved
    * @param message - The message that caused the function to be called. Used to retrieve the author of the message
    * @returns {promise} - The promise that will be resolved into a player
    */
    getCurrentPlayer(message) {
        return sql.get(`SELECT * FROM player WHERE discordId ="${message.author.id}"`).then(player => {
            if (!player) { //player is not in the database
                console.log(`Utilisateur inconnu : ${message.author.username}`);
                return this.getNewPlayer(message);
            } else { //player is in the database
                console.log(`Utilisateur reconnu : ${message.author.username}`);
                return new Player(player.maxHealth, player.health, player.attack, player.defense, player.speed, player.discordId, player.score, player.level, player.experience, player.money, player.effect, player.lastReport)
            }
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }


    /**
    * Return a player created from the defaul values
    * @param message - The message that caused the function to be called. Used to retrieve the author of the message
    * @returns {*} - A new player
    */
    getNewPlayer(message) {
        console.log('Generating a new player...');
        return new Player(DefaultValues.entity.maxHealth, DefaultValues.entity.health, DefaultValues.entity.attack, DefaultValues.entity.defense, DefaultValues.entity.speed, message.author.id, DefaultValues.player.score, DefaultValues.player.level, DefaultValues.player.experience, DefaultValues.player.money, DefaultValues.player.effect, message.createdTimestamp, DefaultValues.player.badges);
    }


    /**
     * Allow to revive a player and save its new state in the database
     * @param {*} player - the player that has to be revived
     * @param {Number} time - the timecode of the date of revive
     * @returns {Number} - the amount of points the player loosed during the revive process
     */
    revivePlayer(player, time) {
        let scoreRomoved = Math.round(player.getScore() * Config.PART_OF_SCORE_REMOVED_DURING_RESPAWN);

        player.setEffect(":smiley:");
        player.heal();
        player.updateLastReport(time);
        player.removeScore(scoreRomoved);

        this.updatePlayer(player);

        return scoreRomoved;
    }

    /**
     * Allow to save the current state of a player in the database
     * @param {*} player - the player that has to be saved
     */
    updatePlayer(player) {

        sql.run(`UPDATE entity SET maxHealth = ${player.maxHealth}, health = ${player.health}, attack = ${player.attack}, defense = ${player.defense}, speed = ${player.speed} WHERE id = ${player.discordId}`).catch(console.error);
        sql.run(`UPDATE player SET score = ${player.score}, level = ${player.level}, experience = ${player.experience}, money = ${player.money}, effect = "${player.effect}", lastReport = ${player.lastReport}, badges = "${player.badges}" WHERE discordId = ${player.discordId}`).catch(console.error);

    }

    /**
     * Allow to save a new player in the database
     * @param {*} player - the player that has to be saved
     */
    addPlayer(player) {

        sql.run(`INSERT INTO entity (maxHealth, health, attack, defense, speed, id) VALUES ( ${player.maxHealth}, ${player.health}, ${player.attack} , ${player.defense} , ${player.speed} , ${player.discordId})`).catch(console.error);
        sql.run(`INSERT INTO player (discordId, score, level, experience, money, effect, lastReport, badges) VALUES (${player.discordId},${player.score},${player.level},${player.experience},${player.money},"${player.effect}", ${player.lastReport}, ${player.badges}) `).catch(console.error);

    }


    //TODO
    getRank(player) {
        return 1;
        //TODO
    }

    //TODO
    getNumberOfPlayer() {
        return 1;
        //TODO
    }
}

module.exports = PlayerManager;