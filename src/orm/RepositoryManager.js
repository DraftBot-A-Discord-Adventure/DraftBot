const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const fs = require("fs");

class RepositoryManager {

    constructor() {
        let asyncConstructor = async () => {
            this.sql = await sqlite
                .open({
                    filename: "data/database/database.sqlite",
                    driver: sqlite3.cached.Database
                });

            this.text = {};
            this.text.items = require("data/items/Values.json");

            await fs.promises.readdir("data/items")
                .then(files => {
                    files.forEach(file => {
                        if (!file.endsWith(".json")) return;
                        if (file.includes("Values.json")) return;

                        let language = file.split(".")[0];
                        let fileContent = require("data/items/" + file);

                        Object.entries(fileContent).forEach(entry => {
                            Object.entries(entry[1]).forEach(subEntry => {
                                if (this.text.items[entry[0]][subEntry[0]].translations === undefined) {
                                    this.text.items[entry[0]][subEntry[0]].translations = {};
                                }
                                this.text.items[entry[0]][subEntry[0]].translations[language] = subEntry[1];
                            });
                        });
                    });
                })
                .catch(console.error);

            await fs.promises.readdir("src/orm/repositories")
                .then(files => {
                    files.forEach(file => {
                        if (!file.endsWith(".js")) return;
                        if (file.endsWith("Abstract.js")) return;
                        let repositoryName = file.split(".")[0];
                        this[repositoryName] = new (require("repositories/" + repositoryName))(this.sql, this.text);
                    });
                })
                .catch(console.error);
        };
        asyncConstructor();
    }

    /**
     * This function analyses the passed database and check if it is valid.
     */
    async checkDatabaseValidity() {
        await this.sql
            .get(`SELECT version FROM database`)
            .catch(async () => {
                await this.createDatabase();
            });

        await this.sql
            .get("SELECT guildId FROM player")
            .catch(async () => {
                await this.updateDatabase();
            });

        await this.setEverybodyAsUnOccupied();
    }

    /**
     * This function create the database
     */
    async createDatabase() {
        console.log("Database ::: created ::: start");

        await this.sql
            .run("CREATE TABLE IF NOT EXISTS entity (id TEXT, maxHealth INTEGER, health INTEGER, attack INTEGER, defense INTEGER, speed INTEGER, effect TEXT)")
            .catch(console.error);

        await this.sql
            .run("CREATE TABLE IF NOT EXISTS player (discordId TEXT, score INTEGER, weeklyScore INTEGER, level INTEGER, experience INTEGER, money INTEGER, lastReport INTEGER, badges TEXT, tampon INTEGER)")
            .catch(console.error);

        await this.sql
            .run("CREATE TABLE IF NOT EXISTS server (id TEXT, prefix TEXT, language TEXT)")
            .catch(console.error);

        await this.sql
            .run("CREATE TABLE IF NOT EXISTS inventory (playerId TEXT, weaponId TEXT, armorId TEXT, potionId TEXT, objectId TEXT, backupItemId TEXT, lastDaily INTEGER)")
            .catch(console.error);

        await this.sql
            .run("CREATE TABLE IF NOT EXISTS guild (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER)")
            .catch(console.error);

        await this.sql
            .run("CREATE TABLE IF NOT EXISTS database (version TEXT, lastReset INTEGER)")
            .then(async () => {
                await this.sql
                    .run(`INSERT INTO database (version, lastReset) VALUES (?, 0)`, Config.version)
                    .then(() => {
                        console.log("Database ::: created ::: end");
                    })
                    .catch(console.error);
            })
            .catch(console.error);
    }

    /**
     * This function update the database
     */
    async updateDatabase() {
        console.log("Database ::: updated ::: start");

        await this.sql
            .run("ALTER TABLE player ADD guildId Text")
            .catch(console.error);

        await this.sql
            .run("CREATE TABLE IF NOT EXISTS guild (guildId TEXT, name TEXT, chief TEXT, score INTEGER, level INTEGER, experience INTEGER, lastInvocation INTEGER)")
            .then(() => {
                console.log("Database ::: updated ::: end");
            })
            .catch(console.error);
    }

    /**
     * Allow to set the state of all the player to normal in order to allow them to play
     */
    async setEverybodyAsUnOccupied() {
        console.log("Database ::: setEverybodyAsUnOccupied ::: start");

        await this.sql
            .run(`UPDATE entity SET effect = ? WHERE effect = ?`, ':smiley:', ':clock10:')
            .then(async () => {
                console.log("Database ::: setEverybodyAsUnOccupied ::: end");
            })
            .catch(console.error);
    }

    // TODO Refactor after

    /**
     * Allow to reset the weekly top.
     */
    async resetWeeklyScoreAndRank() {
        await this.sql
            .run("UPDATE player SET weeklyScore = ?", 0)
            .catch(console.error);
    }
}

module.exports = RepositoryManager;
