/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Events = Sequelize.define("Events", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		fr: {
			type: DataTypes.TEXT,
		},
		en: {
			type: DataTypes.TEXT,
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss"),
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss"),
		},
		restricted_maps: {
			type: DataTypes.TEXT
		},
	}, {
		tableName: "events",
		freezeTableName: true,
	});

	Events.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
	 * @return {Promise<String[]>}
	 */
	Events.prototype.getReactions = async function () {
		const possibilities = await this.getPossibilities();
		const reactions = [];
		for (const possibility of possibilities) {
			reactions.push(possibility.possibilityKey);
		}
		return reactions;
	};

	/**
	 * Pick a random event compatible with the given map type
	 * @param {Maps} map
	 * @returns {Promise<Events>}
	 */
	Events.pickEventOnMapType = async function (map) {
		const query = `SELECT * FROM events LEFT JOIN event_map_location_ids eml ON events.id = eml.event_id WHERE events.id > 0 AND events.id < 9999 AND (
				(events.restricted_maps IS NOT NULL AND events.restricted_maps LIKE :map_type) OR
				(events.restricted_maps IS NULL AND ((eml.map_location_id IS NOT NULL AND eml.map_location_id = :map_id) OR
				                                     (SELECT COUNT(*) FROM event_map_location_ids WHERE event_map_location_ids.map_location_id = eml.map_location_id) = 0))) ORDER BY RANDOM() LIMIT 1;`;
		return await Sequelize.query(query, {
			model: Events,
			replacements: {
				map_type: "%" + map.type + "%",
				map_id: map.id
			},
			type: Sequelize.QueryTypes.SELECT,
		});
	};

	return Events;
};
