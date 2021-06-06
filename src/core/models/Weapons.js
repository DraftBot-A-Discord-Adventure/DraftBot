/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const Weapons = Sequelize.define("Weapons", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		rarity: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.weapons.rarity,
		},
		rawAttack: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.weapons.rawAttack,
		},
		rawDefense: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.weapons.rawDefense,
		},
		rawSpeed: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.weapons.rawSpeed,
		},
		attack: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.weapons.attack,
		},
		defense: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.weapons.defense,
		},
		speed: {
			type: DataTypes.INTEGER,
			defaultValue: JsonReader.models.weapons.speed,
		},
		fr: {
			type: DataTypes.TEXT,
		},
		en: {
			type: DataTypes.TEXT,
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss"),
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss"),
		},
		french_masculine: {
			type: DataTypes.INTEGER
		},
		french_plural: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: "weapons",
		freezeTableName: true,
	});

	Weapons.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
	 * @param {("fr"|"en")} language - The language the inventory has to be displayed in
	 */
	Weapons.prototype.toFieldObject = async function (language) {
		return {
			name: JsonReader.items.getTranslation(language).weapons.fieldName,
			value: (this.id === 0) ? this[language] : format(
				JsonReader.items.getTranslation(language).weapons.fieldValue, {
					name: this[language],
					rarity: this.getRarityTranslation(language),
					values: this.getValues(language),
				}),
		};
	};

	/**
	 * @param {("fr"|"en")} language - The language the weapon has to be displayed in
	 * @return {String}
	 */
	Weapons.prototype.toString = function (language) {
		return (this.id === 0) ? this[language] : format(
			JsonReader.items.getTranslation(language).weapons.fieldValue, {
				name: this[language],
				rarity: this.getRarityTranslation(language),
				values: this.getValues(language),
			});
	};

	/**
	 * @param {("fr"|"en")} language
	 * @return {String}
	 */
	Weapons.prototype.getRarityTranslation = function (language) {
		return JsonReader.items.getTranslation(language).rarities[this.rarity];
	};


	/**
	 * Get the simple name of the item, without rarity or anything else
	 * @param {("fr"|"en")} language
	 * @return {String}
	 */
	Weapons.prototype.getName = function (language) {
		return this[language];
	};

	Weapons.prototype.multiplicateur = function () {
		return JsonReader.items.mapper[this.rarity];
	};

	/**
	 * Return the property from rawProperty and property modifier
	 * @return {Number}
	 */
	Weapons.prototype.getAttack = function () {
		return Math.round(1.15053 * Math.pow(this.multiplicateur(), 2.3617) * Math.pow(1.0569 + (0.1448 / this.multiplicateur()), this.rawAttack)) + this.attack;
	};

	/**
	 * Return the property from rawProperty and property modifier
	 * @return {Number}
	 */
	Weapons.prototype.getDefense = function () {
		let before = 0;
		if (this.rawDefense > 0) {
			before = 1.15053 * Math.pow(this.multiplicateur(), 2.3617) * Math.pow(1.0569 + (0.1448 / this.multiplicateur()), this.rawDefense);
		}
		return Math.round(before * 0.75) + this.defense;
	};

	/**
	 * Return the property from rawProperty and property modifier
	 * @return {Number}
	 */
	Weapons.prototype.getSpeed = function () {
		let before = 0;
		if (this.rawSpeed > 0) {
			before = 1.15053 * Math.pow(this.multiplicateur(), 2.3617) * Math.pow(1.0569 + (0.1448 / this.multiplicateur()), this.rawSpeed);
		}
		return Math.round(before * 0.5) + this.speed;
	};

	/**
	 * @param {("fr"|"en")} language
	 * @return {String}
	 */
	Weapons.prototype.getValues = function (language) {
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

	return Weapons;
};
