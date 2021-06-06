/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const PlayerSmallEvents = Sequelize.define("player_small_events", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		player_id: {
			type: DataTypes.INTEGER
		},
		event_type: {
			type: DataTypes.TEXT
		},
		number: {
			type: DataTypes.INTEGER
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		tableName: "player_small_events",
		freezeTableName: true
	});

	/**
	 * Creates a PlayerSmallEvents object. DOES NOT SAVE IT, you have to do it yourself
	 * @param {Number} player_id
	 * @param {String|string} event_type
	 * @param {Number} number
	 * @returns {PlayerSmallEvents}
	 */
	PlayerSmallEvents.createPlayerSmallEvent = (player_id, event_type, number) => PlayerSmallEvents.build({
		player_id: player_id,
		event_type: event_type,
		number: number
	});

	/**
	 * Removes all the small events of a player
	 * @param {Number} player_id
	 * @returns {Promise<void>}
	 */
	PlayerSmallEvents.removeSmallEventsOfPlayer = async(player_id) => {
		await PlayerSmallEvents.destroy({ where: { player_id: player_id }});
	};

	return PlayerSmallEvents;
};
