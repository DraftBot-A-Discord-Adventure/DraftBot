/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Events = Sequelize.define('Events', {
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
			defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
		},
		restricted_maps: {
			type: DataTypes.TEXT
		},
	}, {
		tableName: 'events',
		freezeTableName: true,
	});

	Events.beforeSave((instance) => {
		instance.setDataValue('updatedAt',
			require('moment')().format('YYYY-MM-DD HH:mm:ss'));
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

	return Events;
};
