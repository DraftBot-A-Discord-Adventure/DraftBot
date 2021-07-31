/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const MapLinks = Sequelize.define("MapLinks", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		startMap: {
			type: DataTypes.INTEGER
		},
		endMap: {
			type: DataTypes.INTEGER
		},
		tripDuration: {
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
		tableName: "map_links",
		freezeTableName: true
	});

	MapLinks.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
	 * Returns a random link
	 * @returns {Promise<null|MapLinks>}
	 */
	MapLinks.getRandomLink = async () => {
		const query = "SELECT id FROM map_links;";
		const linkIds = await Sequelize.query(query, {
			type: Sequelize.QueryTypes.SELECT
		});
		return await MapLinks.getById(linkIds[randInt(0, linkIds.length - 1)].id);
	};


	/**
	 * @param {Number} id
	 * @returns {Promise<null | MapLinks>}
	 */
	MapLinks.getById = (id) => MapLinks.findOne({where: {id: id}});

	return MapLinks;
};
