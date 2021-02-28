/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const PlayerSmallEvents = Sequelize.define('player_small_events', {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		player_id: {
			type: DataTypes.INTEGER,
		},
		event_type: {
			type: DataTypes.INTEGER,
		},
		number: {
			type: DataTypes.INTEGER,
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
		}
	}, {
		tableName: 'player_small_events',
		freezeTableName: true,
	});

	return PlayerSmallEvents;
};
