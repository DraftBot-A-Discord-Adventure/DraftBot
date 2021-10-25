/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const PlayerMissionsInfo = Sequelize.define(
		"PlayerMissionsInfo",
		{
			playerId: {
				type: DataTypes.INTEGER,
				primaryKey: true
			},
			gems: {
				type: DataTypes.INTEGER,
				defaultValue: 0
			},
			dailyMissionNumberDone: {
				type: DataTypes.INTEGER,
				defaultValue: 0
			},
			slotsCount: {
				type: DataTypes.INTEGER,
				defaultValue: 1
			},
			campaignProgression: {
				type: DataTypes.INTEGER,
				defaultValue: 0
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
			tableName: "player_missions_info",
			freezeTableName: true
		}
	);

	PlayerMissionsInfo.beforeSave((instance) => {
		instance.setDataValue(
			"updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss")
		);
	});

	return PlayerMissionsInfo;
};
