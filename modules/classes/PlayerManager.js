const Player = require('./Player');
const DefaultValues = require('../utils/DefaultValues')

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
    * @returns {Player} - A new player
    */
    getNewPlayer(message) {
        console.log('Generating a new player...');
        return new Player(DefaultValues.entity.maxHealth, DefaultValues.entity.health, DefaultValues.entity.attack, DefaultValues.entity.defense, DefaultValues.entity.speed, message.author.id, DefaultValues.player.score, DefaultValues.player.level, DefaultValues.player.experience, DefaultValues.player.money, DefaultValues.player.effect, message.createdTimestamp, DefaultValues.player.badges);
    }


    //TODO
    getRank(player){
        return 1;
        //TODO
    }

      //TODO
      getNumberOfPlayer(){
        return 1;
        //TODO
    }
}

module.exports = PlayerManager;