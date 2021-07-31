const {readdir} = require("fs/promises");

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const MapLocations = Sequelize.define("MapLocations", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		type: {
			type: DataTypes.TEXT
		},
		nameFr: {
			type: DataTypes.TEXT
		},
		nameEn: {
			type: DataTypes.TEXT
		},
		descFr: {
			type: DataTypes.TEXT
		},
		descEn: {
			type: DataTypes.TEXT
		},
		particleFr: {
			type: DataTypes.TEXT
		},
		particleEn: {
			type: DataTypes.TEXT
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
		tableName: "map_locations",
		freezeTableName: true
	});

	MapLocations.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")()
				.format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
	 * @param {"fr"|"en"} language
	 * @returns {string}
	 */
	MapLocations.prototype.getEmote = function(language) {
		return JsonReader.models.maps.getTranslation(language).types[this.type].emote;
	};

	/**
	 * @param {"fr"|"en"} language
	 * @returns {string}
	 */
	MapLocations.prototype.getDisplayName = function(language) {
		return this.getEmote(language) + " " + (language === "fr" ? this.nameFr : this.nameEn);
	};

	/**
	 * @param {"fr"|"en"} language
	 * @returns {string}
	 */
	MapLocations.prototype.getParticleName = function(language) {
		return language === "fr" ? this.particleFr : this.particleEn;
	};

	/**
	 * @param {"fr"|"en"} language
	 * @returns {string}
	 */
	MapLocations.prototype.getDescription = function(language) {
		return language === "fr" ? this.descFr : this.descEn;
	};

	/**
	 * @param {Number} id
	 * @returns {Promise<null | MapLocations>}
	 */
	MapLocations.getById = (id) => MapLocations.findOne({where: {id: id}});

	/**
	 * Returns a random map
	 * @returns {Promise<null|MapLocations>}
	 */
	MapLocations.getRandomMap = async () => {
		const query = "SELECT id FROM map_locations;";
		const mapIds = await Sequelize.query(query, {
			type: Sequelize.QueryTypes.SELECT
		});
		return await MapLocations.getById(mapIds[randInt(0, mapIds.length - 1)].id);
	};

	/**
	 * Get map connected to a map with a certain id and with a map type as a filter
	 * @param mapId
	 * @param blacklistId
	 * @param mapTypes
	 * @returns {Promise<[MapLocations]>}
	 */
	MapLocations.getMapConnected = async (mapId, blacklistId, mapTypes = null) => {
		if (mapTypes) {
			const query = `SELECT id
                           FROM map_locations
                           WHERE :mapTypes LIKE '%' || type || '%'
                             AND id != :blacklistId
                             AND (
                               id IN (SELECT endMap FROM map_links WHERE startMap = :mapId));`;
			return await Sequelize.query(query, {
				type: Sequelize.QueryTypes.SELECT,
				replacements: {
					mapTypes: mapTypes,
					blacklistId: blacklistId,
					mapId: mapId
				}
			});
		}
		const query = `SELECT id
                       FROM map_locations
                       WHERE id != :blacklistid
                         AND (
                           id IN (SELECT endMap FROM map_links WHERE startMap = :mapId));`;
		return await Sequelize.query(query, {
			type: Sequelize.QueryTypes.SELECT,
			replacements: {
				mapId: mapId,
				blacklistId: blacklistId
			}
		});

	};

	/**
	 * Get the number of players on this map
	 * @returns {Promise<Number>}
	 */
	MapLocations.prototype.playersCount = async function() {
		const query = "SELECT COUNT(*) FROM players WHERE mapId = :id;";
		return (await Sequelize.query(query, {
			replacements: {
				id: this.id
			},
			type: Sequelize.QueryTypes.SELECT
		}))[0]["COUNT(*)"];
	};

	MapLocations.getPlayersOnMap = async function(mapId, previousMapId, playerId) {
		const query = "SELECT discordUserId " +
			"FROM players " +
			"JOIN entities ON players.entityId = entities.id " +
			"WHERE players.id != :playerId " +
			"AND ((players.mapId = :mapId AND players.previousMapId = :pMapId) OR (players.mapId = :pMapId AND players.previousMapId = :mapId)) " +
			"ORDER BY RANDOM();";
		return await Sequelize.query(query, {
			replacements: {
				mapId: mapId,
				pMapId: previousMapId,
				playerId: playerId
			},
			type: Sequelize.QueryTypes.SELECT
		});
	};

	MapLocations.getIdMaxMap = async () => (await readdir("resources/text/maplocations/")).length;

	return MapLocations;
};
