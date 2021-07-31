import {DraftBotEmbed} from "../messages/DraftBotEmbed";

const Maps = require("../Maps");
/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Players = Sequelize.define("players", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		score: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.players.score
		},
		weeklyScore: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.players.weeklyScore
		},
		level: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.players.level
		},
		experience: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.players.experience
		},
		money: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.players.money
		},
		class: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.players.class
		},
		badges: {
			type: DataTypes.TEXT,
			defaultValue: JsonReader.models.players.badges
		},
		entityId: {
			type: DataTypes.INTEGER
		},
		guildId: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.players.guildId
		},
		topggVoteAt: {
			type: DataTypes.DATE,
			defaultValue: new Date(0)
		},
		nextEvent: {
			type: DataTypes.INTEGER
		},
		petId: {
			type: DataTypes.INTEGER
		},
		lastPetFree: {
			type: DataTypes.DATE,
			defaultValue: new Date(0)
		},
		effect: {
			type: DataTypes.STRING(32), // eslint-disable-line new-cap
			defaultValue: JsonReader.models.entities.effect
		},
		effectEndDate: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		effectDuration: {
			type: DataTypes.INTEGER,
			defaultValue: 0
		},
		mapLinkId: {
			type: DataTypes.INTEGER
		},
		startTravelDate: {
			type: DataTypes.DATE,
			defaultValue: 0
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		dmNotification: {
			type: DataTypes.BOOLEAN,
			defaultValue: true
		}
	}, {
		tableName: "players",
		freezeTableName: true
	});

	/**
	 * Add a badge to the player badges
	 * @param {String} badge - The badge to be added to player
	 * @returns {boolean} if the badge has been applied
	 */
	Players.prototype.addBadge = function(badge) {
		if (this.badges !== null) {
			if (!this.hasBadge(badge)) {
				this.badges += "-" + badge;
			}
			else {
				return false;
			}
		}
		else {
			this.badges = badge;
		}
		return true;
	};


	/**
	 * @param {String} badge - The badge to be added to player
	 */
	Players.prototype.hasBadge = function(badge) {
		return this.badges === null ? false : this.badges.split("-")
			.includes(badge);
	};

	Players.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
	 * Read the destination of the player
	 * @returns {MapLinks} The current destination of the player
	 */
	Players.prototype.getMap = async () => await MapLinks.getById(this.mapLinkId).endMap;

	/**
	 * Read the starting point of the player
	 * @returns {MapLinks} The current starting map of the player
	 */
	Players.prototype.getPreviousMap = async () => await MapLinks.getById(this.mapLinkId).startMap;

	/**
	 * Read the current trip duration of the player
	 * @returns {Number} The current trip duration in hours
	 */
	Players.prototype.getCurrentTripDuration = async () => await MapLinks.getById(this.mapLinkId).tripDuration;

	/**
	 * @param {Number} id
	 */
	Players.getById = async (id) => {
		const query = `SELECT *
                   FROM (SELECT id,
                                RANK() OVER (ORDER BY score desc, level desc)       rank,
                                RANK() OVER (ORDER BY weeklyScore desc, level desc) weeklyRank
                         FROM players)
                   WHERE id = :id`;
		return await Sequelize.query(query, {
			replacements: {
				id: id
			},
			type: Sequelize.QueryTypes.SELECT
		});
	};

	/**
	 * @param {Number} rank
	 */
	Players.getByRank = async (rank) => {
		const query = `SELECT *
                   FROM (SELECT entityId,
                                RANK() OVER (ORDER BY score desc, level desc)       rank,
                                RANK() OVER (ORDER BY weeklyScore desc, level desc) weeklyRank
                         FROM players)
                   WHERE rank = :rank`;
		return await Sequelize.query(query, {
			replacements: {
				rank: rank
			},
			type: Sequelize.QueryTypes.SELECT
		});
	};

	/**
	 * @return {Number} Return the experience needed to level up.
	 */
	Players.prototype.getExperienceNeededToLevelUp = function() {
		return Math.round(JsonReader.values.xp.player.baseValue * Math.pow(JsonReader.values.xp.player.coeff, this.level + 1)) - JsonReader.values.xp.player.minus;
	};

	/**
	 * @param {Number} score
	 */
	Players.prototype.addScore = function(score) {
		this.score += score;
		this.setScore(this.score);
	};

	/**
	 * @param {Number} score
	 */
	Players.prototype.setScore = function(score) {
		if (score > 0) {
			this.score = score;
		}
		else {
			this.score = 0;
		}
	};

	/**
	 * @param {Number} money
	 */
	Players.prototype.addMoney = function(money) {
		this.money += money;
		this.setMoney(this.money);
	};

	/**
	 * @param {Number} money
	 */
	Players.prototype.setMoney = function(money) {
		if (money > 0) {
			this.money = money;
		}
		else {
			this.money = 0;
		}
	};

	/**
	 * @param {Number} weeklyScore
	 */
	Players.prototype.addWeeklyScore = function(weeklyScore) {
		this.weeklyScore += weeklyScore;
		this.setWeeklyScore(this.weeklyScore);
	};

	/**
	 * @param {Number} weeklyScore
	 */
	Players.prototype.setWeeklyScore = function(weeklyScore) {
		if (weeklyScore > 0) {
			this.weeklyScore = weeklyScore;
		}
		else {
			this.weeklyScore = 0;
		}
	};

	/**
	 * @param {"fr"|"en"} language
	 */
	Players.prototype.getPseudo = async function(language) {
		await this.setPseudo(language);
		return this.pseudo;
	};

	/**
	 * @param {"fr"|"en"} language
	 */
	Players.prototype.setPseudo = async function(language) {
		const entity = await this.getEntity();
		if (entity.discordUserId !== undefined &&
			client.users.cache.get(entity.discordUserId) !== undefined) {
			this.pseudo = client.users.cache.get(entity.discordUserId).username;
		}
		else {
			this.pseudo = JsonReader.models.players.getTranslation(language).pseudo;
		}
	};

	/**
	 * @return {Boolean} True if the player has levelUp false otherwise
	 */
	Players.prototype.needLevelUp = function() {
		return this.experience >= this.getExperienceNeededToLevelUp();
	};

	/**
	 * @return {Number} get the id of the classgroup
	 */
	Players.prototype.getClassGroup = function() {
		return this.level < CLASS.GROUP1LEVEL ? 0 :
			this.level < CLASS.GROUP2LEVEL ? 1 :
				this.level < CLASS.GROUP3LEVEL ? 2 :
					3;
	};

	/**
	 * Get the different rewards the user can have when he level up
	 * @param language
	 * @param entity
	 * @returns {Promise<*[]>} an array containing the bonuses to give to the player
	 */
	Players.prototype.getLvlUpReward = async function(language, entity) {
		const bonuses = [];
		if (this.level === FIGHT.REQUIRED_LEVEL) {
			bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.fightUnlocked);
		}
		if (this.level === GUILD.REQUIRED_LEVEL) {
			bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.guildUnlocked);
		}

		if (this.level % 10 === 0) {
			entity.health = await entity.getMaxHealth();
			bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.healthRestored);
		}

		if (this.level === CLASS.REQUIRED_LEVEL) {
			bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.classUnlocked);
		}

		if (this.level === CLASS.GROUP1LEVEL) {
			bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.classTiertwo);
		}
		if (this.level === CLASS.GROUP2LEVEL) {
			bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.classTierthree);
		}
		if (this.level === CLASS.GROUP3LEVEL) {
			bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.classTierfour);
		}

		bonuses.push(JsonReader.models.players.getTranslation(language).levelUp.noBonuses);
		return bonuses;
	};

	/**
	 * Checks if the player need to level up and levels up him.
	 * @param {Entity} entity
	 * @param {module:"discord.js".TextChannel} channel The channel in which the level up message will be sent
	 * @param {"fr"|"en"} language
	 */
	Players.prototype.levelUpIfNeeded = async function(entity, channel, language) {
		if (!this.needLevelUp()) {
			return;
		}

		const xpNeeded = this.getExperienceNeededToLevelUp();

		this.level++;

		const bonuses = await this.getLvlUpReward(language, entity);

		this.experience -= xpNeeded;
		let msg = format(JsonReader.models.players.getTranslation(language).levelUp.mainMessage, {
			mention: entity.getMention(),
			level: this.level
		});
		for (let i = 0; i < bonuses.length - 1; ++i) {
			msg += bonuses[i] + "\n";
		}
		msg += bonuses[bonuses.length - 1];
		await channel.send(msg);

		if (this.needLevelUp()) {
			return this.levelUpIfNeeded(entity, channel, language);
		}
	};

	/**
	 * Update the lastReport matching the last time the player has been see
	 * @param {Number} time
	 * @param {Number} timeMalus
	 * @param {String} effectMalus
	 */
	Players.prototype.setLastReportWithEffect = async function(time, timeMalus, effectMalus) {
		this.startTravelDate = new Date(time);
		await this.save();
		await require("../../core/Maps").applyEffect(this, effectMalus, timeMalus);
	};

	/**
	 * Apply dead effect, send message in channel and in PM only if the health is 0 or less.
	 * @param {Entity} entity
	 * @param {module:"discord.js".TextChannel} channel The channel in which the level up message will be sent
	 * @param {"fr"|"en"} language
	 * @return {Promise<boolean>}
	 */
	Players.prototype.killIfNeeded = async function(entity, channel, language) {

		if (entity.health > 0) {
			return false;
		}
		log("This user is dead : " + entity.discordUserId);
		await Maps.applyEffect(entity.Player, EFFECT.DEAD);
		await channel.send(format(JsonReader.models.players.getTranslation(language).ko, {pseudo: await this.getPseudo(language)}));

		const guildMember = await channel.guild.members.fetch(entity.discordUserId);
		const user = guildMember.user;
		const transDMN = JsonReader.models.players.getTranslation(language);
		this.dmNotification ? sendDirectMessage(user, transDMN.koPM.title, transDMN.koPM.description, JsonReader.bot.embed.default, language)
			: channel.send(new DraftBotEmbed()
				.setDescription(transDMN.koPM.description)
				.setTitle(transDMN.koPM.title)
				.setFooter(transDMN.dmDisabledFooter));

		return true;
	};

	Players.prototype.isInactive = function() {
		return this.startTravelDate.getTime() + minutesToMilliseconds(120) + JsonReader.commands.topCommand.fifth10days < Date.now();
	};

	/**
	 * Returns if the effect of the player is finished or not
	 * @return {boolean}
	 */
	Players.prototype.currentEffectFinished = function() {
		if (this.effect === EFFECT.DEAD || this.effect === EFFECT.BABY) {
			return false;
		}
		if (this.effect === EFFECT.SMILEY) {
			return true;
		}
		return this.effectEndDate.getTime() < Date.now();
	};

	Players.prototype.effectRemainingTime = function() {
		let remainingTime = 0;
		if (JsonReader.models.players.effectMalus[this.effect] || this.effect === EFFECT.OCCUPIED) {
			remainingTime = this.effectEndDate - Date.now();
		}
		if (remainingTime < 0) {
			remainingTime = 0;
		}
		return remainingTime;
	};

	/**
	 * @return {Boolean}
	 */
	Players.prototype.checkEffect = function() {
		return [EFFECT.BABY, EFFECT.SMILEY, EFFECT.DEAD].indexOf(this.effect) !== -1;
	};

	Players.prototype.getLevel = function() {
		return this.level;
	};


	return Players;
};
