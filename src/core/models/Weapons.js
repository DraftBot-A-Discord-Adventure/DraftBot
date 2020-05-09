module.exports = (sequelize, DataTypes) => {

  const Weapons = sequelize.define('Weapons', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    rarity: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.rarity
    },
    rawAttack: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.rawAttack
    },
    rawDefense: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.rawDefense
    },
    rawSpeed: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.rawSpeed
    },
    attack: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.attack
    },
    defense: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.defense
    },
    speed: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.weapons.speed
    },
    fr: {
      type: DataTypes.TEXT
    },
    en: {
      type: DataTypes.TEXT
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
    }
  }, {
    tableName: 'weapons',
    freezeTableName: true
  });

  Weapons.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @param {("fr"|"en")} language - The language the inventory has to be displayed in
   */
  Weapons.prototype.toFieldObject = async function(language) {
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
   * @param {("fr"|"en")} language
   * @return {String}
   */
  Weapons.prototype.getRarityTranslation = function(language) {
    return JsonReader.items.getTranslation(language).rarities[this.rarity];
  };

  /**
   * Return the property from rawProperty and property modifier
   * @returns {Number}
   */
  Weapons.prototype.getAttack = function() {
    return JsonReader.items.power[this.rarity][this.rawAttack] + this.attack;
  };

  /**
   * Return the property from rawProperty and property modifier
   * @returns {Number}
   */
  Weapons.prototype.getDefense = function() {
    return JsonReader.items.power[this.rarity][this.rawDefense] + this.defense;
  };

  /**
   * Return the property from rawProperty and property modifier
   * @returns {Number}
   */
  Weapons.prototype.getSpeed = function() {
    return JsonReader.items.power[this.rarity][this.rawSpeed] + this.speed;
  };

  /**
   * @param {("fr"|"en")} language
   * @return {String}
   */
  Weapons.prototype.getValues = function(language) {
    let values = [];

    if (this.getAttack() !== 0) {
      values.push(format(JsonReader.items.getTranslation(language).attack, {attack: this.getAttack()}));
    }

    if (this.getDefense() !== 0) {
      values.push(format(JsonReader.items.getTranslation(language).defense, {defense: this.getDefense()}));
    }

    if (this.getSpeed() !== 0) {
      values.push(format(JsonReader.items.getTranslation(language).speed, {speed: this.getSpeed()}));
    }

    return values.join(' ');
  };

  return Weapons;
};
