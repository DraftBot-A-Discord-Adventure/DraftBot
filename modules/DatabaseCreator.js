const Config = require('./utils/Config');

class DatabaseManager {

    /**
     * This function analyses the passed database and check if it is valid. if no : create the database
     * @param sql - a sqlite file.
     */
    checkDatabaseValidity(sql) {
        console.log('Checking Database ...');
        sql.get(`SELECT version FROM database`).catch(() => {
            this.createDatabase(sql);
        })
    }

    /**
     * This function create the database
     * @param sql - a sqlite file.
     */
    createDatabase(sql) {
        console.log("... Database is not valid !");
        console.log("Database Generation ...");
        sql.run("CREATE TABLE IF NOT EXISTS entity (id TEXT, maxHealth INTEGER, health INTEGER, attack INTEGER, defense INTEGER, speed INTEGER)");
        sql.run("CREATE TABLE IF NOT EXISTS database (version TEXT)").then(() => {
            sql.run(`INSERT INTO database (version) VALUES (\"${Config.version}\")`).then(() => {
                console.log("... Generation Complete !");
            });
        });
    }
}

module.exports = DatabaseManager;