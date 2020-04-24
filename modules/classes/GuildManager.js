const Guild = require('./Guild');
const Player = require('./Player');
const DefaultValues = require('../utils/DefaultValues')
const sql = require("sqlite");
sql.open("./modules/data/database.sqlite");

class GuildManager {

    deleteGuild(guildId) {
        sql.all(`DELETE FROM guild WHERE guildId = ${guildId}`)
    }

    /**
     * Get the total number of players in the database
     * @returns {Integer} - The number of players
     */
    async getNumberOfMembersWithGuildId(guildId) {
        return sql.get(`SELECT COUNT(*) as count FROM player WHERE guildId = ?`, ["" + guildId]).then(number => {
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
        return sql.all(`SELECT *FROM(SELECT *, ROW_NUMBER () OVER (ORDER BY score desc) as rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) as weeklyRank FROM entity JOIN player on entity.id = player.discordId) WHERE guildId = ? ORDER BY score DESC`, [guildId]).then(data => {
            data.forEach(function (player) {
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
        return sql.get(`SELECT * FROM player WHERE discordId = ?`, ["" + message.author.id]).then(Player => {
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
        return sql.get(`SELECT * FROM player WHERE discordId = ?`, ["" + id]).then(Player => {
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
        return sql.get(`SELECT * FROM guild WHERE chief = ?`, ["" + chief]).then(guild => {
            if (!guild) { //Guild is not in the database
                console.log(`unknown guild loaded from ${chief}`);
                return null;
            } else { //Guild is in the database
                console.log(`guild loaded from player ${chief}`);
                return new Guild(guild.guildId, guild.name, guild.chief, guild.score, guild.level, guild.experience, guild.lastInvocation);
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
        return sql.get(`SELECT * FROM guild WHERE name = ?`, ["" + name]).then(guild => {
            if (!guild) { //Guild is not in the database
                console.log(`unknown guild loaded from name ${name}`);
                return null;
            } else { //Guild is in the database
                console.log(`guild loaded from name ${name}`);
                return new Guild(guild.guildId, guild.name, guild.chief, guild.score, guild.level, guild.experience, guild.lastInvocation);
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
        return sql.get(`SELECT * FROM guild WHERE guildId = ?`, ["" + id]).then(guild => {
            if (!guild) { //Guild is not in the database
                console.log(`guild unknown : ${id}`);
                return null;
            } else { //Guild is in the database
                console.log(`guild loaded : ${id}`);
                return new Guild(guild.guildId, guild.name, guild.chief, guild.score, guild.level, guild.experience, guild.lastInvocation);
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
        return sql.get(`SELECT * FROM guild WHERE name = ?`, ["" + name]).then(name => {
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
     * Return a Guild created from the defaul values
     * @param message - The message that caused the function to be called. Used to retrieve the timestamp of the message
     * @returns {*} - A new Guild
     */
    async getNewGuild(message, chief, guildName) {
        console.log('Generating a new Guild...');
        return new Guild(message.id, guildName, chief, 0, 0, 0, message.createdTimestamp);
    }


    /**
     * Allow to save the current state of a Guild in the database
     * @param {*} Guild - The Guild that has to be saved
     */
    updateGuild(Guild) {
        console.log("Updating Guild ...");
        sql.run(`UPDATE guild SET name = ?, chief = ?, score = ?, level = ?, experience = ?, lastInvocation = ? WHERE guildId = ?`,
            ["" + Guild.name, Guild.chief, Guild.score, Guild.level, Guild.experience, Guild.lastInvocation, Guild.guildId]).catch(console.error);
        console.log("Guild updated !");
    }

    /**
     * Allow to save the new score of a Guild without saving the other attributes
     * @param {*} Guild - The Guild that has to be saved
     */
    updateGuildScore(Guild) {
        console.log("Updating Guild ...");
        sql.run(`UPDATE guild SET score = ? WHERE guildId = ?`, [Guild.score, Guild.guildId]).catch(console.error);
        console.log("Guild updated !");
    }

    /**
     * Allow to save a new Guild in the database
     * @param {*} Guild - The Guild that has to be saved
     */
    addGuild(guild) {
        console.log("Creating Guild ...");
        sql.run(`INSERT INTO guild (guildId, name, chief, score, level, experience, lastInvocation) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ["" + guild.guildId, "" + guild.name, "" + guild.chief, guild.score, guild.level, guild.experience, guild.lastInvocation]);
        console.log("Guild created !");
    }

}

module.exports = GuildManager;