/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Potions = Sequelize.define("Potions", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		rarity: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.potions.rarity
		},
		power: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.potions.power
		},
		nature: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.potions.nature
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
		tableName: "potions",
		freezeTableName: true
	});

	Potions.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
	 * @param {("fr"|"en")} language - The language the inventory has to be displayed in
	 */
	Potions.prototype.toFieldObject = function(language) {
		return {
			name: JsonReader.items.getTranslation(language).potions.fieldName,
			value: this.id === 0 ? this[language] : format(
				JsonReader.items.getTranslation(language).potions.fieldValue, {
					name: this[language],
					rarity: this.getRarityTranslation(language),
					nature: this.getNatureTranslation(language)
				})
		};
	};

	/**
	 * @param {("fr"|"en")} language - The language the potion has to be displayed in
	 * @return {String}
	 */
	Potions.prototype.toString = function(language) {
		return this.id === 0 ? this[language] : format(
			JsonReader.items.getTranslation(language).potions.fieldValue, {
				name: this[language],
				rarity: this.getRarityTranslation(language),
				nature: this.getNatureTranslation(language)
			});
	};

	/**
	 * Get the potion name without bold or emoji
	 * @param {("fr"|"en")} language
	 * @returns {*}
	 */
	Potions.prototype.getSimplePotionName = function(language) {
		return this[language].substr(this[language].indexOf(" ") + 1).replace(/\*\*/g, "");
	};

	/**
	 *
	 * @return {String}
	 */
	Potions.prototype.getEmoji = function() {
		const emojiSimple = this.fr.split(" ")[0];
		const emoji = emojiSimple.includes("<") ? emojiSimple.split(":")[2].replace(">", "") : emojiSimple;
		if (!client.emojis.cache.get(emoji)) {
			return emojiSimple;
		}
		return emoji;
	};

	/**
	 * @param {("fr"|"en")} language
	 * @return {String}
	 */
	Potions.prototype.getRarityTranslation = function(language) {
		return JsonReader.items.getTranslation(language).rarities[this.rarity];
	};

	/**
	 * @param {("fr"|"en")} language
	 * @return {String}
	 */
	Potions.prototype.getNatureTranslation = function(language) {
		return format(
			JsonReader.items.getTranslation(language).potions.natures[this.nature],
			{
				power: this.power
			});
	};
	/**
	 * Get the simple name of the item, without rarity or anything else
	 * @param {("fr"|"en")} language
	 * @return {String}
	 */
	Potions.prototype.getName = function(language) {
		return this[language];
	};

	/**
	 * @return {Number}
	 */
	Potions.prototype.getAttack = function() {
		if (this.nature === 3) {
			return this.power;
		}
		return 0;
	};

	/**
	 * @return {Number}
	 */
	Potions.prototype.getDefense = function() {
		if (this.nature === 4) {
			return this.power;
		}
		return 0;
	};

	/**
	 * @return {Number}
	 */
	Potions.prototype.getSpeed = function() {
		if (this.nature === 2) {
			return this.power;
		}
		return 0;
	};

	/**
	 * @return {Boolean}
	 */
	Potions.prototype.isFightPotion = function() {
		return this.getSpeed() !== 0 || this.getAttack() !== 0 ||
			this.getDefense() !== 0;
	};

	return Potions;
};
