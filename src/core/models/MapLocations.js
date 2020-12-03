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
			type: DataTypes.TEXT,
			primaryKey: true
		},
		type: {
			type: DataTypes.TEXT
		},
		x_coordinates: {
			type: DataTypes.INTEGER
		},
		y_coordinates: {
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
