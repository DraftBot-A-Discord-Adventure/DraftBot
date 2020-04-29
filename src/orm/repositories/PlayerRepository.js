const RepositoryAbstract = require("repositories/RepositoryAbstract");
const Player = require("entities/Player");

class PlayerRepository extends RepositoryAbstract {

    /**
     * Return a promise that will contain the player that sent a message once it has been resolved
     * @param {*} message
     * @return {Promise<Player>}
     */
    async getByMessageOrCreate(message) {
        return await this.sql
            .get(`SELECT * FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY score desc) as rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) as weeklyRank FROM entity JOIN player on entity.id = player.discordId) WHERE discordId = ?`, message.author.id)
            .then(async player => {
                if (player) {
                    return new Player(
                        player.id, player.maxHealth, player.health, player.attack, player.defense, player.speed, player.effect,
                        player.score, player.weeklyScore, player.level, player.experience, player.money, player.lastReport, player.badges, player.guildId, player.rank, player.weeklyRank
                    );
                } else {
                    return await this.create(new Player(
                        message.author.id, Config.entity.maxHealth, Config.entity.health, Config.entity.attack, Config.entity.defense, Config.entity.speed, Config.entity.effect,
                        Config.player.score, Config.player.weeklyScore, Config.player.level, Config.player.experience, Config.player.money, message.createdTimestamp, Config.player.badges, Config.player.guildId, Config.player.rank, Config.player.weeklyRank
                    ));
                }
            })
            .catch(console.error);
    }

    /**
     * Return a promise that will contain the player that sent a message once it has been resolved
     * @param {number} id
     * @return {Promise<Player>}
     */
    async getByIdOrCreate(id) {
        return await this.sql
            .get(`SELECT * FROM (SELECT *, ROW_NUMBER() OVER (ORDER BY score desc) as rank, ROW_NUMBER () OVER (ORDER BY weeklyScore desc) as weeklyRank FROM entity JOIN player on entity.id = player.discordId) WHERE discordId = ?`, id)
            .then(async player => {
                if (player) {
                    return new Player(
                        player.id, player.maxHealth, player.health, player.attack, player.defense, player.speed, player.effect,
                        player.score, player.weeklyScore, player.level, player.experience, player.money, player.lastReport, player.badges, player.guildId, player.rank, player.weeklyRank
                    );
                } else {
                    return await this.create(new Player(
                        id, Config.entity.maxHealth, Config.entity.health, Config.entity.attack, Config.entity.defense, Config.entity.speed, Config.entity.effect,
                        Config.player.score, Config.player.weeklyScore, Config.player.level, Config.player.experience, Config.player.money, Date.now(), Config.player.badges, Config.player.guildId, Config.player.rank, Config.player.weeklyRank
                    ));
                }
            })
            .catch(console.error);
    }

    /**
     * Return an player created from the default values and save it to the database
     * @param {Player} player
     * @return {Promise<Player|void>}
     */
    async create(player) {
        await this.sql
            .run(
                `INSERT INTO entity (id, maxHealth, health, attack, defense, speed, effect) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                player.get('id'), player.get('maxHealth'), player.get('health'), player.get('attack'), player.get('defense'), player.get('speed'), player.get('effect')
            )
            .catch(console.error);

        return await this.sql
            .run(
                `INSERT INTO player (discordId, score, weeklyScore, level, experience, money, lastReport, badges, guildId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                player.get('discordId'), player.get('score'), player.get('weeklyScore'), player.get('level'), player.get('experience'), player.get('money'), player.get('lastReport'), player.get('badges'), player.get('guildId')
            )
            .then(() => {
                return player;
            })
            .catch(console.error);
    }

    /**
     * Return an player updated from the values and save it to the database
     * @param {Player} player
     * @return {Promise<Player|void>}
     */
    async update(player) {
        await this.sql
            .run(
                `UPDATE entity SET maxHealth = ?, health = ?, attack = ?, defense = ?, speed = ?, effect = ? WHERE id = ?`,
                player.get('maxHealth'), player.get('health'), player.get('attack'), player.get('defense'), player.get('speed'), player.get('effect'), player.get('id')
            )
            .catch(console.error);

        return await this.sql
            .run(
                `UPDATE player SET score = ?, weeklyScore = ?, level = ?, experience = ?, money = ?, lastReport = ?, badges = ?, guildId = ? WHERE discordId = ?`,
                player.get('score'), player.get('weeklyScore'), player.get('level'), player.get('experience'), player.get('money'), player.get('lastReport'), player.get('badges'), player.get('guildId'), player.get('discordId')
            )
            .then(() => {
                return player;
            })
            .catch(console.error);
    }

    /**
     * Get the total number of players in the database
     * @returns {Promise<number>}
     */
    async getNumberOfPlayers() {
        return await this.sql
            .get(`SELECT COUNT(*) as count FROM player WHERE score > 1`) // TODO : On enlève juste les joueurs qui n'ont jamais joué ... ? plutot que score > 100 sinon le classement est tout cassé
            .then(number => {
                return number.count;
            })
            .catch(console.error);
    }

    // TODO
    async resetWeeklyScoreAndRank() {
        await this.sql.run('UPDATE player SET weeklyScore = ?', 0).
        catch(console.error);
    }

}

module.exports = PlayerRepository;
