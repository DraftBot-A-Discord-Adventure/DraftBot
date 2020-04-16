const Config = require('./utils/Config');
const sql = require("sqlite");
sql.open("./modules/data/database.sqlite");

class DatabaseManager {

    /**
     * This function analyses the passed database and check if it is valid. if no : create the database
     * @param sql - a sqlite file.
     */
    checkDatabaseValidity(sql) {
        console.log('Checking Database ...');
        sql.get(`SELECT version FROM database`).catch(() => {
            this.createDatabase(sql);
        });
        sql.get("SELECT guildId FROM player").catch(() => {
            this.updateDatabase(sql);
        }).then(() => {
            console.log('... Database is valid !');
        });

    }

    updateDatabase(sql) {
        //Add guildId column
        sql.run("ALTER TABLE player ADD guildId Text").catch(console.error);
        //guild server
        sql.run("CREATE TABLE IF NOT EXISTS guild (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER)").catch(console.error);

        console.log("database updated !")
    }

    /**
  * Allow to set the state of all the player to normal in order to allow them to play
  */
    setEverybodyAsUnOccupied() {
        console.log("Updating everybody ...");
        sql.run(`UPDATE entity SET effect = ":smiley:" WHERE effect = ":clock10:"`).catch(console.error);
        console.log("everybody updated !");
    }

    /**
     * This function create the database
     * @param sql - a sqlite file.
     */
    createDatabase(sql) {
        console.log("... Database is not valid !\nDatabase Generation ...");

        //table entity
        sql.run("CREATE TABLE IF NOT EXISTS entity (id TEXT, maxHealth INTEGER, health INTEGER, attack INTEGER, defense INTEGER, speed INTEGER, effect TEXT)").catch(console.error);
        //table player
        sql.run("CREATE TABLE IF NOT EXISTS player (discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, tampon INTEGER)")
        //table server
        sql.run("CREATE TABLE IF NOT EXISTS server (id TEXT, prefix TEXT, language TEXT)").catch(console.error);
        //table inventory
        sql.run("CREATE TABLE IF NOT EXISTS inventory (playerId TEXT, weaponId TEXT, armorId TEXT, potionId TEXT, objectId TEXT, backupItemId TEXT, lastDaily INTEGER)").catch(console.error);
        //guild server
        sql.run("CREATE TABLE IF NOT EXISTS guild (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER)").catch(console.error);

        //table only used to store the version of the bot when the database was created
        sql.run("CREATE TABLE IF NOT EXISTS database (version TEXT, lastReset INTEGER)").then(() => {
            sql.run(`INSERT INTO database (version, lastReset) VALUES (\"${Config.version}\",0)`).then(() => {
                console.log("... Generation Complete !");
            });
        });

    }

    /**
     * Allow to reset the weekly top.
     */
    async resetWeeklyScoreAndRank() {
        //Reset weeklyScore column.
        await sql.run("UPDATE player SET weeklyScore = 0").catch(console.error);
    }
}
module.exports = DatabaseManager;