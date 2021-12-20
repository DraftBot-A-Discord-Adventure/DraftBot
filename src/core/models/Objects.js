import {Constants} from "../Constants";

const {readdir} = require("fs/promises");

/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Objects = Sequelize.define("Objects", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		rarity: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.objects.rarity
		},
		power: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.objects.power
		},
		nature: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.objects.nature
		},
		fr: {
			type: DataTypes.TEXT
		},
		en: {
			type: DataTypes.TEXT
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		frenchMasculine: {
			type: DataTypes.INTEGER
		},
		frenchPlural: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: "objects",
		freezeTableName: true
	});

	Objects.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
     * @param {("fr"|"en")} language - The language the inventory has to be displayed in
     * @param {number} maxStatsValue - max value for speed
     */
	Objects.prototype.toFieldObject = function(language, maxStatsValue) {
		return {
			name: JsonReader.items.getTranslation(language).objects.fieldName,
			value: this.id === 0 ? this[language] : this.toString(language, maxStatsValue)
		};
	};

	/**
     * Get the full name of the object, with the rarity and nature
     * @param {("fr"|"en")} language - The language the potion has to be displayed in
     * @param {number} maxStatsValue - max value for speed
     * @return {String}
     */
	Objects.prototype.toString = function(language, maxStatsValue) {
		return this.id === 0 ? this[language] : format(
			JsonReader.items.getTranslation(language).objects.fieldValue, {
				name: this[language],
				rarity: this.getRarityTranslation(language),
				nature: this.getNatureTranslation(language, maxStatsValue)
			});
	};

	/**
     * Get the simple name of the item, without rarity or anything else
     * @param {("fr"|"en")} language
     * @return {String}
     */
	Objects.prototype.getName = function(language) {
		return this[language];
	};

	/**
     * @param {("fr"|"en")} language
     * @return {String}
     */
	Objects.prototype.getRarityTranslation = function(language) {
		return JsonReader.items.getTranslation(language).rarities[this.rarity];
	};

	/**
     * @param {("fr"|"en")} language
     * @param{number} maxStatsValue - speedMaxValue
     * @return {String}
     */
	Objects.prototype.getNatureTranslation = function(language, maxStatsValue) {
		if (this.nature === NATURE.HOSPITAL) {
			return format(
				JsonReader.items.getTranslation(language).objects.natures[this.nature],{
					power: this.power,
					powerInMinutes: this.power * 60
				});
		}
		if (this.nature === NATURE.SPEED) {
			if (isNaN(maxStatsValue)) {
				maxStatsValue = Infinity;
			}
			const speedDisplay = maxStatsValue >= this.power / 2 ? this.power : format(JsonReader.items.getTranslation(language).nerfDisplay,
				{
					old: this.power,
					max: Math.round(maxStatsValue + this.power / 2)
				});
			return format(
				JsonReader.items.getTranslation(language).objects.natures[this.nature],
				{power: speedDisplay});
		}
		return format(
			JsonReader.items.getTranslation(language).objects.natures[this.nature],
			{power: this.power});

	};

	/**
     * @return {Number}
     */
	Objects.prototype.getAttack = function() {
		if (this.nature === NATURE.ATTACK) {
			return this.power;
		}
		return 0;
	};

	/**
     * @return {Number}
     */
	Objects.prototype.getDefense = function() {
		if (this.nature === NATURE.DEFENSE) {
			return this.power;
		}
		return 0;
	};

	/**
     * @return {Number}
     */
	Objects.prototype.getSpeed = function() {
		if (this.nature === NATURE.SPEED) {
			return this.power;
		}
		return 0;
	};

	Objects.getMaxId = async () => (await readdir("resources/text/objects/")).length - 1;

	Objects.prototype.getCategory = function() {
		return Constants.ITEM_CATEGORIES.OBJECT;
	};

	Objects.getById = function(id) {
		return Objects.findOne({
			where: {id}
		});
	};

	Objects.randomItem = async function(nature, rarity) {
		return await Objects.findOne({
			where: {
				nature,
				rarity
			},
			order: Sequelize.random()
		});
	};

	Objects.getAllIdsForRarity = async function(rarity) {
		const query = `SELECT id
	               FROM objects
	               WHERE rarity = :rarity`;
		return await Sequelize.query(query, {
			replacements: {
				rarity: rarity
			},
			type: Sequelize.QueryTypes.SELECT
		});
	};

	return Objects;
};
