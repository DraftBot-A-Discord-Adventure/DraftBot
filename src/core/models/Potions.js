module.exports = (sequelize, DataTypes) => {

  const Potions = sequelize.define('Potions', {
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
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
    }
  }, {
    tableName: 'potions',
    freezeTableName: true
  });

  Potions.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * TODO 2.0 Garde t'on le cas specifique pour les id 0 ou on n'affiche pas la rarity et la valeur ?
   * @param {("fr"|"en")} language - The language the inventory has to be displayed in
   */
  Potions.prototype.toFieldObject = async function(language) {
    return {
      name: JsonReader.models.potions.getTranslation(language).fieldName,
      value: (this.id === 0) ? this[language] : format(
          JsonReader.models.potions.getTranslation(language).fieldValue, {
            name: this[language],
            rarity: this.getRarityTranslation(language),
            nature: this.getNatureTranslation(language),
          }),
    };
  };

  /**
   * @param {("fr"|"en")} language
   * @return {String}
   */
  Potions.prototype.getRarityTranslation = function(language) {
    return JsonReader.models.item.getTranslation(language).rarities[this.rarity];
  };

  /**
   * @param {("fr"|"en")} language
   * @return {String}
   */
  Potions.prototype.getNatureTranslation = function(language) {
    return format(JsonReader.models.potions.getTranslation(language).natures[this.nature], {power: this.power});
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

  return Potions;
};
