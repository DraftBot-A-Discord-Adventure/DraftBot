/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const EventMapLocationIds = Sequelize.define("EventMapLocationIds", {
		eventId: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},
		mapLocationId: {
			type: DataTypes.INTEGER,
			primaryKey: true
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
		tableName: "event_map_location_ids",
		freezeTableName: true
	});

	EventMapLocationIds.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	return EventMapLocationIds;
};
