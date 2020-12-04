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

	return MapLocations;
};
