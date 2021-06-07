/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Possibilities = Sequelize.define(
		"Possibilities",
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			possibilityKey: {
				type: DataTypes.STRING(32) // eslint-disable-line no-alert
			},
			lostTime: {
				type: DataTypes.INTEGER
			},
			health: {
				type: DataTypes.INTEGER
			},
			oneshot: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			},
			effect: {
				type: DataTypes.STRING(32) // eslint-disable-line no-alert
			},
			experience: {
				type: DataTypes.INTEGER
			},
			money: {
				type: DataTypes.INTEGER
			},
			item: {
				type: DataTypes.BOOLEAN
			},
			fr: {
				type: DataTypes.TEXT
			},
			en: {
				type: DataTypes.TEXT
			},
			eventId: {
				type: DataTypes.INTEGER
			},
			nextEvent: {
				type: DataTypes.INTEGER
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
			},
			restrictedmaps: {
				type: DataTypes.TEXT
			}
		},
		{
			tableName: "possibilities",
			freezeTableName: true
		}
	);

	Possibilities.beforeSave((instance) => {
		instance.setDataValue(
			"updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss")
		);
	});

	return Possibilities;
};
