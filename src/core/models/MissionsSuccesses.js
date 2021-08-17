/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const MissionsSuccesses = Sequelize.define(
		"MissionsSuccesses",
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			titleFr: {
				type: DataTypes.TEXT
			},
			descriptionFr: {
				type: DataTypes.TEXT
			},
			titleEn: {
				type: DataTypes.TEXT
			},
			descriptionEn: {
				type: DataTypes.TEXT
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
			tableName: "MissionsSuccesses",
			freezeTableName: true
		}
	);

	MissionsSuccesses.beforeSave((instance) => {
		instance.setDataValue(
			"updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss")
		);
	});

	/**
	 * get a missionSuccess from its id
	 * @param {Number} id
	 */
	MissionsSuccesses.getById = (id) => MissionsSuccesses.findOne({
		where: {
			id: id
		}
	});

	/**
	 * get how many times the task must be done
	 * @param {Number} strength
	 * @param {Boolean} isMission
	 */
	MissionsSuccesses.prototype.getNumberToDo = (strength, isMission) => {
		const allStrengths = this.getAllStrengths(isMission);
		return allStrengths[strength];
	}

	/**
	 * get all strengths for a given missionSuccess
	 * @param {Boolean} isMission
	 */
	MissionsSuccesses.prototype.getAllStrengths = (isMission) => {
		const missionSuccessCurrent = JsonReader.missionsSuccesses.loadFile(parseInt(this.id) + ".json");
		return isMission ? missionSuccessCurrent.isMission : missionSuccessCurrent.isSuccess;
	}



	return MissionsSuccesses;
};
