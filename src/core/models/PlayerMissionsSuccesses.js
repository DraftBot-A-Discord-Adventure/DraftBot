/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const PlayerMissionsSuccesses = Sequelize.define(
		"PlayerMissionsSuccesses",
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			playerId: {
				type: DataTypes.INTEGER
			},
			missionSuccessId: {
				type: DataTypes.INTEGER,
				defaultValue: 0
			},
			strength: {
				type: DataTypes.INTEGER
			},
			isMission: {
				type: DataTypes.BOOLEAN,
				defaultValue: false
			},
			numberDone: {
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
			tableName: "player_missions_successes",
			freezeTableName: true
		}
	);

	PlayerMissionsSuccesses.beforeSave((instance) => {
		instance.setDataValue(
			"updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss")
		);
	});

	/**
	 * get a playerMissionSuccess from its id
	 * @param {Number} id
	 */
	PlayerMissionsSuccesses.getById = (id) => PlayerMissionsSuccesses.findOne({
		where: {
			id: id
		}
	});

	/**
	 * create a playerMission in the database
	 * @param {Player} player
	 * @param {MissionsSuccesses} missionSuccess
	 * @param {Number} strength
	 * @returns {Promise<PlayerMissionsSuccesses>}
	 */
	PlayerMissionsSuccesses.createPlayerMission = (player, missionSuccess, strength) => PlayerMissionsSuccesses.build({
		playerId: player.id,
		missionSuccessId: missionSuccess.id,
		strength: strength,
		isMission: true
	});

	/**
	 * Create a playerSuccess in the database
	 * @param {Player} player
	 * @param {MissionsSuccesses} missionSuccess
	 * @param {Number} strength
	 * @param {Number} numberDone
	 * @returns {Promise<PlayerMissionsSuccesses>}
	 */
	PlayerMissionsSuccesses.createPlayerSuccess = (player, missionSuccess, strength, numberDone) => PlayerMissionsSuccesses.build({
		playerId: player.id,
		missionSuccessId: missionSuccess.id,
		strength: strength,
		numberDone: numberDone
	});

	/**
	 * Update the current PlayerMissionSuccess entity
	 * @param nbTimes
	 */
	PlayerMissionsSuccesses.prototype.updateMissionSuccess = (nbTimes) => {
		this.numberDone += nbTimes;
		this.awardMissionSuccess();
	};

	/**
	 * Test if the quest must be awarded
	 * @return boolean
	 */
	PlayerMissionsSuccesses.prototype.isAwardable = () =>
		MissionsSuccesses.getById(this.missionSuccessId)
			.getNumberToDo(this.strength, this.isMission)
			>= this.numberDone;

	/**
	 * Award the player for its completed PlayerMissionSuccess
	 */
	PlayerMissionsSuccesses.prototype.awardMissionSuccess = () => {
		if (!this.isAwardable()) {
			return;
		}
		// TODO donner la récompense
		if (this.isMission) {
			// TODO remplacer la mission par une mission 0
		}
		else {
			// TODO remplacer le haut fait par sa version supérieure
		}
	};

	return PlayerMissionsSuccesses;
};
