/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
import {DraftBotEmbed} from "../messages/DraftBotEmbed";

module.exports = (Sequelize, DataTypes) => {
	const Guilds = Sequelize.define(
		"Guilds",
		{
			id: {
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true
			},
			name: {
				type: DataTypes.STRING(32) // eslint-disable-line new-cap
			},
			guildDescription: {
				type: DataTypes.STRING(300) // eslint-disable-line new-cap
			},
			score: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.guilds.score
			},
			level: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.guilds.level
			},
			experience: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.guilds.experience
			},
			commonFood: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.guilds.commonFood
			},
			carnivorousFood: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.guilds.carnivorousFood
			},
			herbivorousFood: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.guilds.herbivorousFood
			},
			ultimateFood: {
				type: DataTypes.INTEGER,
				defaultValue: JsonReader.models.guilds.ultimateFood
			},
			lastDailyAt: {
				type: DataTypes.DATE,
				defaultValue: JsonReader.models.guilds.lastDailyAt
			},
			chiefId: {
				type: DataTypes.INTEGER
			},
			elderId: {
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
			tableName: "guilds",
			freezeTableName: true
		}
	);

	Guilds.beforeSave((instance) => {
		instance.setDataValue(
			"updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss")
		);
	});

	Guilds.prototype.updateLastDailyAt = function() {
		const moment = require("moment");
		this.lastDailyAt = new moment(); // eslint-disable-line new-cap
	};

	/**
	 * @param {Number} id
	 */
	Guilds.getById = (id) => Guilds.findOne({
		where: {
			id: id
		},
		include: [
			{
				model: GuildPets,
				as: "GuildPets",
				include: [
					{
						model: PetEntities,
						as: "PetEntity",
						include: [
							{
								model: Pets,
								as: "PetModel"
							}
						]
					}
				]
			}
		]
	});

	/**
	 * @param {String} name
	 */
	Guilds.getByName = (name) => Guilds.findOne({
		where: {
			name: name
		},
		include: [
			{
				model: GuildPets,
				as: "GuildPets",
				include: [
					{
						model: PetEntities,
						as: "PetEntity",
						include: [
							{
								model: Pets,
								as: "PetModel"
							}
						]
					}
				]
			}
		]
	});

	/**
	 * @return {Number} Return the experience needed to level up.
	 */
	Guilds.prototype.getExperienceNeededToLevelUp = function() {
		return (
			Math.round(
				JsonReader.values.xp.player.baseValue *
				Math.pow(JsonReader.values.xp.player.coeff, this.level + 1)
			) - JsonReader.values.xp.player.minus
		);
	};

	/**
	 * @param {Number} experience
	 */
	Guilds.prototype.addExperience = function(experience) {
		this.experience += experience;
		this.setExperience(this.experience);
	};

	/**
	 * @param {Number} experience
	 */
	Guilds.prototype.setExperience = function(experience) {
		if (experience > 0) {
			this.experience = experience;
		}
		else {
			this.experience = 0;
		}
	};

	/**
	 * @return {Boolean} True if the guild has levelUp false otherwise
	 */
	Guilds.prototype.needLevelUp = function() {
		return this.experience >= this.getExperienceNeededToLevelUp();
	};

	/**
	 * Checks if the player need to level up and levels up him.
	 * @param {module:"discord.js".TextChannel} channel The channel in which the level up message will be sent
	 * @param {"fr"|"en"} language
	 */
	Guilds.prototype.levelUpIfNeeded = function(channel, language) {
		if (!this.needLevelUp()) {
			return;
		}
		this.experience -= this.getExperienceNeededToLevelUp();
		this.level++;
		const embed = new DraftBotEmbed()
			.setTitle(
				format(
					JsonReader.models.guilds.getTranslation(language).levelUp.title,
					{
						guildName: this.name
					}
				)
			)
			.setDescription(
				format(
					JsonReader.models.guilds.getTranslation(language).levelUp
						.desc,
					{
						level: this.level
					}
				)
			);
		channel.send(embed);

		if (this.needLevelUp()) {
			return this.levelUpIfNeeded(channel, language);
		}
	};

	/**
	 * @returns {boolean}
	 */
	Guilds.isPetShelterFull = (guild) => {
		if (!guild.GuildPets) {
			return true;
		}
		return guild.GuildPets.length >= JsonReader.models.pets.slots;
	};

	return Guilds;
};
