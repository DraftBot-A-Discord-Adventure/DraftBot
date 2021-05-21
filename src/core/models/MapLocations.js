/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const MapLocations = Sequelize.define('MapLocations', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		type: {
			type: DataTypes.TEXT
		},
		north_map: {
			type: DataTypes.INTEGER
		},
		east_map: {
			type: DataTypes.INTEGER
		},
		south_map: {
			type: DataTypes.INTEGER
		},
		west_map: {
			type: DataTypes.INTEGER
		},
		name_fr: {
			type: DataTypes.TEXT
		},
		name_en: {
			type: DataTypes.TEXT
		},
		desc_fr: {
			type: DataTypes.TEXT
		},
		desc_en: {
			type: DataTypes.TEXT
		},
		particle_fr: {
			type: DataTypes.TEXT
		},
		particle_en: {
			type: DataTypes.TEXT
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
		},
	}, {
		tableName: 'map_locations',
		freezeTableName: true,
	});

	MapLocations.beforeSave((instance) => {
		instance.setDataValue('updatedAt',
			require('moment')().format('YYYY-MM-DD HH:mm:ss'));
	});

	/**
	 * @param {"fr"|"en"} language
	 * @returns {string}
	 */
	MapLocations.prototype.getEmote = function(language) {
		return JsonReader.models.maps.getTranslation(language).types[this.type].emote
	}

	/**
	 * @param {"fr"|"en"} language
	 * @returns {string}
	 */
	MapLocations.prototype.getDisplayName = function(language) {
		return this.getEmote(language) + " " + (language === "fr" ? this.name_fr : this.name_en)
	}

	/**
	 * @param {"fr"|"en"} language
	 * @returns {string}
	 */
	MapLocations.prototype.getParticleName = function(language) {
		return (language === "fr" ? this.particle_fr : this.particle_en)
	}

	/**
	 * @param {"fr"|"en"} language
	 * @returns {string}
	 */
	MapLocations.prototype.getDescription = function(language) {
		return (language === "fr" ? this.desc_fr : this.desc_en)
	}

	/**
	 * @param {Number} id
	 * @returns {Promise<null | MapLocations>}
	 */
	MapLocations.getById = (id) => {
		return MapLocations.findOne({ where: { id: id }})
	}

	/**
	 * Returns a random map
	 * @returns {Promise<null|MapLocations>}
	 */
	MapLocations.getRandomMap = async () => {
		const query = `SELECT id FROM map_locations;`;
		const mapIds = await Sequelize.query(query, {
			type: Sequelize.QueryTypes.SELECT,
		});
		return await MapLocations.getById(mapIds[randInt(0, mapIds.length - 1)].id);
	}

	/**
	 * Get map connected to a map with a certain id and with a map type as a filter
	 * @param map_id
	 * @param map_types
	 * @returns {Promise<[MapLocations]>}
	 */
	MapLocations.getMapConnectedWithTypeFilter = async (map_id, map_types) => {
		const query = `SELECT id FROM map_locations WHERE :map_types LIKE '%' || type || '%' AND (
										id IN (SELECT north_map FROM map_locations WHERE id = :map_id) OR
										id IN (SELECT south_map FROM map_locations WHERE id = :map_id) OR
										id IN (SELECT east_map FROM map_locations WHERE id = :map_id) OR
										id IN (SELECT west_map FROM map_locations WHERE id = :map_id));`;
		return await Sequelize.query(query, {
			type: Sequelize.QueryTypes.SELECT,
			replacements: {
				map_types: map_types,
				map_id: map_id
			}
		});
	}

	/**
	 * Get the number of players on this map
	 * @returns {Promise<Number>}
	 */
	MapLocations.prototype.playersCount = async function() {
		const query = `SELECT COUNT(*) FROM players WHERE map_id = :id;`;
		return (await Sequelize.query(query, {
			replacements: {
				id: this.id
			},
			type: Sequelize.QueryTypes.SELECT
		}))[0]['COUNT(*)'];
	}

	MapLocations.getPlayersOnMap = async function(map_id, previous_map_id, player_id) {
		const query = `SELECT discordUser_id FROM players JOIN entities ON players.entity_id = entities.id WHERE players.id != :player_id AND ((players.map_id = :map_id AND players.previous_map_id = :p_map_id) OR (players.map_id = :p_map_id AND players.previous_map_id = :map_id)) ORDER BY RANDOM();`;
		return (await Sequelize.query(query, {
			replacements: {
				map_id: map_id,
				p_map_id: previous_map_id,
				player_id: player_id
			},
			type: Sequelize.QueryTypes.SELECT
		}));
	}

	return MapLocations;
};
