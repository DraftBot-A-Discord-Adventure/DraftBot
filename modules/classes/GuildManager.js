const Guild = require('./Guild');
const Player = require('./Player');
const DefaultValues = require('../utils/DefaultValues')
const Config = require('../utils/Config')
const sql = require("sqlite");
const ServerManager = require('./ServerManager');
const PlayerManager = require('./PlayerManager');
sql.open("./modules/data/database.sqlite");

class GuildManager {

    deleteGuild(guildId) {
        sql.all(`DELETE FROM guild WHERE guildId = ${guildId}`);
    }

    /**
     * Get the total number of players in the database
     * @returns {Integer} - The number of players
     */
    async getNumberOfMembersWithGuildId(guildId) {
        return sql.get(`SELECT COUNT(*) as count FROM player WHERE guildId = "${guildId}"`).then(number => {
            return number.count
        }).catch(error => { //there is no database
            console.error(error)
            return 0;
        })
    }

    /**
    * Allow to retrieve all players from a guild
    * @returns {*} - All players from the guild
    */
    async getGuildMembers(guildId) {
        let MembersArray = Array();
        let i = 0;
        return sql.all(`SELECT * FROM player WHERE guildId = "${guildId}" ORDER BY score DESC`).then(data => {
            data.forEach(function(player) {
                MembersArray[i] = new Player(player.maxHealth, player.health, player.attack, player.defense, player.speed,
                    player.discordId, player.score, player.level, player.experience, player.money, player.effect, player.lastReport, player.badges, player.rank, player.weeklyScore,
                    player.weeklyRank, player.guildId)
                i++;
            });
            return MembersArray;
        });
    }

    /**
    * Return a promise that will contain the Guild that sent a message once it has been resolved
    * @param message - The message that caused the function to be called. Used to retrieve the author of the message
    * @returns {promise} - The promise that will be resolved into a Guild
    */
    async getCurrentGuild(message) {
        return sql.get(`SELECT * FROM player WHERE discordId ="${message.author.id}"`).then(Player => {
            if (!Player) { //Player is not in the database
                return null;
            } else { //Player is in the database
                let guild = this.getGuildById(Player.guildId);
                return guild;
            }
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }

    /**
    * Return a promise that will contain the Guild
    * @param id - The user id
    * @returns {promise} - The promise that will be resolved into a Guild
    */
   async getGuildByUserId(id) {
    return sql.get(`SELECT * FROM player WHERE discordId ="${id}"`).then(Player => {
        if (!Player) { //Player is not in the database
            return null;
        } else { //Player is in the database
            let guild = this.getGuildById(Player.guildId);
            return guild;
        }
    }).catch(error => { //there is no database
        console.error(error)
        return false;
    })
}

    /**
    * Return a promise that will contain the Guild that sent a message once it has been resolved
    * @param chief - The guild chief
    * @returns {promise} - The promise that will be resolved into a Guild
    */
    async getGuildByChiefId(chief) {
        return sql.get(`SELECT * FROM guild WHERE chief ="${chief}"`).then(guild => {
            if (!guild) { //Guild is not in the database
                console.log(`unknown guild loaded from ${chief}`);
                return null;
            } else { //Guild is in the database
                console.log(`guild loaded from player ${chief}`);
                return new Guild(guild.guildId, guild.name, guild.chief, guild.score, guild.level, guild.experience, guild.rank);
            }
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }

    /**
    * Return a promise that will contain the Guild that sent a message once it has been resolved
    * @param name - The guild name
    * @returns {promise} - The promise that will be resolved into a Guild
    */
    async getGuildByName(name) {
        return sql.get(`SELECT * FROM guild WHERE name ="${name}"`).then(guild => {
            if (!guild) { //Guild is not in the database
                console.log(`unknown guild loaded from name ${name}`);
                return null;
            } else { //Guild is in the database
                console.log(`guild loaded from name ${name}`);
                return new Guild(guild.guildId, guild.name, guild.chief, guild.score, guild.level, guild.experience, guild.rank);
            }
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }



    /**
     * Return a promise that will contain the Guild that sent a message once it has been resolved
     * @param id - The id of the guild 
     * @returns {promise} - The promise that will be resolved into a Guild
     */
    async getGuildById(id) {
        return sql.get(`SELECT * FROM guild WHERE guildId ="${id}"`).then(guild => {
            if (!guild) { //Guild is not in the database
                console.log(`guild unknown : ${id}`);
                return null;
            } else { //Guild is in the database
                console.log(`guild loaded : ${id}`);
                return new Guild(guild.guildId, guild.name, guild.chief, guild.score, guild.level, guild.experience, guild.rank);
            }
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }

    /**
    * Return a promise that will contain the Guild that sent a message once it has been resolved
    * @returns {boolean} - If guild name is available
    */
    async checkNewNameAvailability(name) {
        return sql.get(`SELECT * FROM guild WHERE name ="${name}"`).then(name => {
            if (!name) { //name is not in the database
                return true;
            } else { //name is in the database
                return false;
            }
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }


    /**
     * Return a promise that will contain theid of the Guild matching a rank given as an input
     * @param rank - The rank of the guild 
     * @returns {promise} - The promise that will be resolved into a Guild
     */
    getIdByRank(rank) {
        return sql.get(`SELECT guildId FROM guild WHERE rank ="${rank}"`).then(id => {
            return id.guildId;
        }).catch(error => { //there is no database
            console.error(error)
            return false;
        })
    }


    /**
     * Return a Guild created from the defaul values
     * @param message - The message that caused the function to be called. Used to retrieve the timestamp of the message
     * @returns {*} - A new Guild
     */
    async getNewGuild(message, chief, guildName) {
        console.log('Generating a new Guild...');
        return new Guild(await this.getNewGuildId(message), guildName, chief, 0, 0, 0, 0);
    }


    /**
     * Return an id for a new guild
     * @returns {*} - A new guild id
     */
    async getNewGuildId(message) {
        console.log('Generating a new Guild Id...');
        let id = message.createdTimestamp;
        console.log('Generated a new guild with id ' + id);
        return id;
    }

    /**
     * Allow to save the current state of a Guild in the database
     * @param {*} Guild - The Guild that has to be saved
     */
    updateGuild(Guild) {
        console.log("Updating Guild ...");
        sql.run(`UPDATE guild SET name = "${Guild.name}", chief = ${Guild.chief} WHERE guildId = ${Guild.guildId}`).catch(console.error);
        sql.run(`UPDATE guild SET score = ${Guild.score}, level = ${Guild.level}, experience = ${Guild.experience} WHERE guildId = ${Guild.guildId}`).catch(console.error);
        console.log("Guild updated !");
    }

    /**
     * Allow to save the new score of a Guild without saving the other attributes
     * @param {*} Guild - The Guild that has to be saved
     */
    updateGuildScore(Guild) {
        console.log("Updating Guild ...");
        sql.run(`UPDATE guild SET score = ${Guild.score} WHERE guildId = ${Guild.guildId}`).catch(console.error);
        console.log("Guild updated !");
    }

    /**
     * Allow to save a new Guild in the database
     * @param {*} Guild - The Guild that has to be saved
     */
    addGuild(guild) {
        console.log("Creating Guild ...");
        sql.run(`INSERT INTO guild (guildId, name, chief, score, level, experience, rank) VALUES ("${guild.guildId}", "${guild.name}", "${guild.chief}", ${guild.score}, ${guild.level}, ${guild.experience}, ${guild.rank})`);
        console.log("Guild created !");
    }


    /**
     * Get the total number of Guilds in the database
     * @returns {Integer} - The number of Guilds
     */
    getNumberOfGuilds() {
        return sql.get(`SELECT COUNT(*) as count FROM guild WHERE score > 100`).then(number => {
            return number.count
        }).catch(error => { //there is no database
            console.error(error)
            return 0;
        })
    }

    /**
     * Get the total number of actives Guilds in the database
     * @returns {Integer} - The number of Guilds
     */
    getNumberOfActiveGuilds() {
        return sql.get(`select MAX(rank) as count from guild`).then(number => {
            return number.count
        }).catch(error => { //there is no database
            console.error(error)
            return 0;
        })
    }

    /**
     * Allow to retrieve the data from the top between 2 limits
     * @param {Integer} borneinf - The lower limit of the top
     * @param {Integer} bornesup - The uppper limit of the top
     * @returns {*} -The data of the top (an array of Guilds)
     */
    getTopData(borneinf, bornesup) {
        let GuildArray = Array();
        let i = 0;
        return sql.all(`SELECT * FROM guild WHERE rank >= ${borneinf} AND rank <= ${bornesup} AND score > 100 ORDER BY score DESC`).then(data => {
            data.forEach(function (Guild) {
                GuildArray[i] = new Guild(guildId, name, chief, score, level, experience, rank)
                i++;
            });
            return GuildArray;
        });
    }
}

module.exports = GuildManager;