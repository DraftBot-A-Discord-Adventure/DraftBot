class DatabaseManager {

    constructor(sql, config) {
        this.sql = sql;
        this.config = config;
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
                    .run(`INSERT INTO database (version, lastReset) VALUES (?, 0)`, this.config.version)
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
            .run(`UPDATE entity SET effect = ? WHERE effect = ?`,
                ':smiley:',
                ':clock10:'
            )
            .then(async () => {
                console.log("Database ::: setEverybodyAsUnOccupied ::: end");
            })
            .catch(console.error);
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
