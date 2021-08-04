/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const PlayerSmallEvents = Sequelize.define("PlayerSmallEvents", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		playerId: {
			type: DataTypes.INTEGER
		},
		eventType: {
			type: DataTypes.TEXT
		},
		time: {
			type: DataTypes.INTEGER
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")()
				.format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")()
				.format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		tableName: "player_small_events",
		freezeTableName: true
	});

	/**
	 * Creates a PlayerSmallEvents object. DOES NOT SAVE IT, you have to do it yourself
	 * @param {Number} playerId
	 * @param {String|string} eventType
	 * @param {Number} time
	 * @returns {PlayerSmallEvents}
	 */
	PlayerSmallEvents.createPlayerSmallEvent = (playerId, eventType, time) => PlayerSmallEvents.build({
		playerId: playerId,
		eventType: eventType,
		time: time
	});

	/**
	 * get the most recent small Event
	 * @param {[PlayerSmallEvents]} playerSmallEvents
	 * @returns {PlayerSmallEvents} The most recent small event
	 */
	PlayerSmallEvents.getLast = (playerSmallEvents) => {
		let mostRecent = null;
		for (const i of playerSmallEvents) {
			if (mostRecent === null) {
				mostRecent = i;
			}
			else if (i.time >= mostRecent.time) {
				mostRecent = i;
			}
		}
		return mostRecent;
	};

	/**
	 * Removes all the small events of a player
	 * @param {Number} playerId
	 * @returns {Promise<void>}
	 */
	PlayerSmallEvents.removeSmallEventsOfPlayer = async (playerId) => {
		await PlayerSmallEvents.destroy({where: {playerId: playerId}});
	};

	return PlayerSmallEvents;
};
