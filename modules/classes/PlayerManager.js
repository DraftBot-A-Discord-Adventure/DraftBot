const Player = require('./Player');
const DefaultValues = require('../utils/DefaultValues')
const Config = require('../utils/Config')
const sql = require("sqlite");
const Text = require('../text/Francais');

sql.open("./modules/data/database.sqlite");

class PlayerManager {


    /**
    * Return a promise that will contain the player that sent a message once it has been resolved
    * @param message - The message that caused the function to be called. Used to retrieve the author of the message
    * @returns {promise} - The promise that will be resolved into a player
    */
    getCurrentPlayer(message) {
        return sql.get(`SELECT * FROM entity JOIN player on entity.id = player.discordId WHERE discordId ="${message.author.id}"`).then(player => {
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
        return new Player(DefaultValues.entity.maxHealth, DefaultValues.entity.health, DefaultValues.entity.attack, DefaultValues.entity.defense, DefaultValues.entity.speed, message.author.id, DefaultValues.player.score, DefaultValues.player.level, DefaultValues.player.experience, DefaultValues.player.money, DefaultValues.entity.effect, message.createdTimestamp, DefaultValues.player.badges);
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
     * Allow to set the state of a player to occupied in order to ensure he dont cheat
     * @param {*} player - the player that has to be saved
     */
    setPlayerAsOccupied(player) {

        console.log("Updating player ...");
        sql.run(`UPDATE entity SET effect = ":clock10:" WHERE id = ${player.discordId}`).catch(console.error);
        console.log("Player updated !");
    }


    /**
     * Allow to save the current state of a player in the database
     * @param {*} player - the player that has to be saved
     */
    updatePlayer(player) {

        console.log("Updating player ...");
        sql.run(`UPDATE entity SET maxHealth = ${player.maxHealth}, health = ${player.health}, attack = ${player.attack}, defense = ${player.defense}, speed = ${player.speed}, effect = "${player.effect}" WHERE id = ${player.discordId}`).catch(console.error);
        sql.run(`UPDATE player SET score = ${player.score}, level = ${player.level}, experience = ${player.experience}, money = ${player.money}, lastReport = ${player.lastReport}, badges = "${player.badges}" WHERE discordId = ${player.discordId}`).catch(console.error);
        console.log("Player updated !");
    }

    /**
     * Allow to save a new player in the database
     * @param {*} player - the player that has to be saved
     */
    addPlayer(player) {

        console.log("Creating player ...");
        sql.run(`INSERT INTO entity (maxHealth, health, attack, defense, speed, id, effect) VALUES ( ${player.maxHealth}, ${player.health}, ${player.attack} , ${player.defense} , ${player.speed} , ${player.discordId},"${player.effect}")`).catch(console.error);
        sql.run(`INSERT INTO player (discordId, score, level, experience, money, lastReport, badges) VALUES (${player.discordId},${player.score},${player.level},${player.experience},${player.money}, ${player.lastReport}, "${player.badges}") `).catch(console.error);
        console.log("Player created !");
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

    /**
     * check if the player is healthy or not. if the player is sick, display an error message
     * @param message - The message that caused the function to be called. Used to retrieve the author of the message
     * @returns {boolean} - True is the player is in good health
     */
    checkState(player, message) {
        let result = false;
        switch (player.getEffect()) {
            case ":smiley:":
                result = true;
                break;

            default:
                message.channel.send(Text.playerManager.errorEmoji + message.author + Text.playerManager.errorMain);


        }
        return result
    }
}

module.exports = PlayerManager;