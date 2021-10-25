/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const MissionSlots = Sequelize.define(
		"MissionSlots",
		{
			playerId: {
				type: DataTypes.INTEGER,
				primaryKey: true
			},
			missionId: {
				type: DataTypes.TEXT
			},
			missionVariant: {
				type: DataTypes.INTEGER
			},
			missionObjective: {
				type: DataTypes.INTEGER
			},
			expiresAt: {
				type: DataTypes.DATE
			},
			numberDone: {
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
			tableName: "mission_slots",
			freezeTableName: true
		}
	);

	MissionSlots.beforeSave((instance) => {
		instance.setDataValue(
			"updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss")
		);
	});

	return MissionSlots;
};
