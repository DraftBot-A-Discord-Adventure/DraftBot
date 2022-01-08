/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
 import {DraftBotEmbed} from "../messages/DraftBotEmbed";
 import {Constants} from "../Constants";
 
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
				 JsonReader.values.xp.baseValue *
				 Math.pow(JsonReader.values.xp.coeff, this.level + 1)
			 ) - JsonReader.values.xp.minus
		 );
	 };
 
	 /**
	  * Add xp to a guild and level up if needed
	  * @param {Number} experience
	  * @param {"fr"|"en"} language
	  * @param {Message} message
	  */
	 Guilds.prototype.addExperience = async function(experience,message,language) {
		 if (this.isAtMaxLevel()) {
			 return;
		 }
		 // We assume that you cannot go the level 98 to 100 with 1 xp addition
		 if (this.level === Constants.GUILD.MAX_LEVEL - 1) {
			 const xpNeededToLevelUp = this.getExperienceNeededToLevelUp();
			 if (this.experience + experience > xpNeededToLevelUp) {
				 experience = xpNeededToLevelUp - this.experience;
			 }
		 }
		 this.experience += experience;
		 this.setExperience(this.experience);
		 while (this.needLevelUp()) {
			 await this.levelUpIfNeeded(message.channel, language);
		 }
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
	  * Checks if the guild need to level up and levels up it.
	  * @param {TextChannel} channel The channel in which the level up message will be sent
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
		 channel.send({ embeds: [embed] });
 
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
 
	 Guilds.prototype.getElderId = function() {
		 return this.elderId;
	 };
 
	 Guilds.prototype.getChiefId = function() {
		 return this.chiefId;
	 };
 
	 Guilds.prototype.isAtMaxLevel = function() {
		 return this.level >= Constants.GUILD.MAX_LEVEL;
	 };
 
	 // ---------------------------------------------------------------------------------------------------------------------
	 // PART ON botFacts Small Events
	 // ---------------------------------------------------------------------------------------------------------------------
	 /**
	  * Get the mean level of all guilds
	  * @return {Promise<Number>}
	  */
	 Guilds.getGuildLevelMean = async () => {
		 const query = `SELECT AVG(level)
						FROM Guilds`;
		 return Math.round(
			 (await Sequelize.query(query, {
				 type: Sequelize.QueryTypes.SELECT
			 }))[0]["AVG(level)"]
		 );
	 };
 
	 return Guilds;
 };
 