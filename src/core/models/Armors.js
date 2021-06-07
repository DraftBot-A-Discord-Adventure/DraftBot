/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Armors = Sequelize.define("Armors", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		rarity: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.armors.rarity
		},
		rawAttack: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.armors.rawAttack
		},
		rawDefense: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.armors.rawDefense
		},
		rawSpeed: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.armors.rawSpeed
		},
		attack: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.armors.attack
		},
		defense: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.armors.defense
		},
		speed: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.armors.speed
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
		tableName: "armors",
		freezeTableName: true
	});

	Armors.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
	 * @param {("fr"|"en")} language - The language the armor has to be displayed in
	 */
	Armors.prototype.toFieldObject = function(language) {
		return {
			name: JsonReader.items.getTranslation(language).armors.fieldName,
			value: this.id === 0 ? this[language] : format(
				JsonReader.items.getTranslation(language).armors.fieldValue, {
					name: this[language],
					rarity: this.getRarityTranslation(language),
					values: this.getValues(language)
				})
		};
	};

	/**
	 * @param {("fr"|"en")} language - The language the armor has to be displayed in
	 * @return {String}
	 */
	Armors.prototype.toString = function(language) {
		return this.id === 0 ? this[language] : format(
			JsonReader.items.getTranslation(language).weapons.fieldValue, {
				name: this[language],
				rarity: this.getRarityTranslation(language),
				values: this.getValues(language)
			});
	};

	/**
	 * @param {("fr"|"en")} language
	 * @return {String}
	 */
	Armors.prototype.getRarityTranslation = function(language) {
		return JsonReader.items.getTranslation(language).rarities[this.rarity];
	};

	Armors.prototype.multiplicateur = function() {
		return JsonReader.items.mapper[this.rarity];
	};

	/**
	 * Return the property from rawProperty and property modifier
	 * @return {Number}
	 */
	Armors.prototype.getAttack = function() {
		let before = 0;
		if (this.rawAttack > 0) {
			before = 1.15053 * Math.pow(this.multiplicateur(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplicateur(), this.rawAttack);
		}
		return Math.round(before * 0.75) + this.attack;
	};


	/**
	 * Get the simple name of the item, without rarity or anything else
	 * @param {("fr"|"en")} language
	 * @return {String}
	 */
	Armors.prototype.getName = function(language) {
		return this[language];
	};


	/**
	 * Return the property from rawProperty and property modifier
	 * @return {Number}
	 */
	Armors.prototype.getDefense = function() {
		return Math.round(1.15053 * Math.pow(this.multiplicateur(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplicateur(), this.rawDefense)) + this.defense;
	};

	/**
	 */
	Armors.prototype.getSpeed = function() {
		let before = 0;
		if (this.rawSpeed > 0) {
			before = 1.15053 * Math.pow(this.multiplicateur(), 2.3617) * Math.pow(1.0569 + 0.1448 / this.multiplicateur(), this.rawSpeed);
		}
		return Math.round(before * 0.5) + this.speed;
	};

	/**
	 * @param {("fr"|"en")} language
	 * @return {String}
	 */
	Armors.prototype.getValues = function(language) {
		const values = [];

		if (this.getAttack() !== 0) {
			values.push(format(JsonReader.items.getTranslation(language).attack,
				{attack: this.getAttack()}));
		}

		if (this.getDefense() !== 0) {
			values.push(format(JsonReader.items.getTranslation(language).defense,
				{defense: this.getDefense()}));
		}

		if (this.getSpeed() !== 0) {
			values.push(format(JsonReader.items.getTranslation(language).speed,
				{speed: this.getSpeed()}));
		}

		return values.join(" ");
	};

	return Armors;
};
