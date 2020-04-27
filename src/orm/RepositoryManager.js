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
    async checkDatabaseMigrations() {

        console.log("checkDatabaseMigrations ::: start");

        await this.sql
            .migrate({
                migrationsPath: "data/migrations"
            })
            .catch(console.error);

        console.log("checkDatabaseMigrations ::: end");

        await this.setEverybodyAsUnOccupied();
    }

    /**
     * Allow to set the state of all the player to normal in order to allow them to play
     */
    async setEverybodyAsUnOccupied() {
        await this.sql
            .run(`UPDATE entity SET effect = ? WHERE effect = ?`, ':smiley:', ':clock10:')
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
