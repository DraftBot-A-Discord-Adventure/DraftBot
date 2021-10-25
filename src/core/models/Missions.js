/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Missions = Sequelize.define(
		"Missions",
		{
			id: {
				type: DataTypes.TEXT,
				primaryKey: true
			},
			descFr: {
				type: DataTypes.TEXT
			},
			descEn: {
				type: DataTypes.TEXT
			},
			campaignOnly: {
				type: DataTypes.BOOLEAN
			},
			gems: {
				type: DataTypes.INTEGER
			},
			xp: {
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
		},
		{
			tableName: "missions",
			freezeTableName: true
		}
	);

	Missions.beforeSave((instance) => {
		instance.setDataValue(
			"updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss")
		);
	});

	return Missions;
};
