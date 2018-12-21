const TypeOperators = require('./utils/TypeOperators');

class PlayerManager {
    constructor() {
        this.players = [];
    }

    /**
     * Returns the array of Player instances.
     * @returns {Array} - The array where Player instances are registered.
     */
    getPlayers() {
        return this.players;
    }

    /**
     * Returns the Player instance associated with the provided Discord User ID.
     * @param id The Discord User ID to look for.
     * @returns {*} - The Player associated to the Discord User ID if found, null otherwise.
     */
    getPlayerById(id) {
        let i = 0;
        while (i < this.getNumberOfPlayers()) {
            if (this.players[i].getDiscordId() === id) {
                return this.players[i];
            }
            i++;
        }
        return null;
    }

    /**
     * Returns the number of players registered in the PlayerManager.
     * @returns {number} - The number of player instances registered in the PlayerManager.
     */
    getNumberOfPlayers() {
        return this.getPlayers().length;
    }

    /**
     * Adds a player to the array of players.
     * @param player - The player to add.
     */
    addPlayer(player) {
        if (TypeOperators.isAPlayer(player)) {
            this.players.push(player);
        }
    }

    /**
     * Removes a player from the array of players.
     * @param player - The player to remove.
     */
    removePlayer(player) {
        let playerIndex = this.getPlayers().indexOf(player);
        if (playerIndex !== -1) {
            this.players.splice(playerIndex, 1);
        }
    }
}

module.exports = PlayerManager;