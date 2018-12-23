class PlayerManager {

    constructor(sql) {
        this.sql = sql;
    }

    getCurrentPlayer(message) {
        sql.get(`SELECT * FROM player WHERE userId ="${message.author.id}"`).then(player => {
            if (!player) { //player is not in the database
                console.log(`Utilisateur inconnu : ${message.author.username}`);
                return new Player(message.createdTimestamp);
            } else { //player is in the database
                console.log(`Utilisateur reconnu : ${message.author.username}`);
                return new Player(player.maxHealth,player.health,player.attack,player.defense,player.speed,player.discordId,player.level,player.experience,player.money,player.effect,player.lastReport)
            }
        }).catch(() => { //there is no database
            console.error("ERROR : Le joueur n'a pas pu être chargé")
            return false;
        })
    }




}

module.exports = PlayerManager;