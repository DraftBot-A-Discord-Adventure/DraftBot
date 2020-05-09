module.exports = (sequelize, DataTypes) => {

  const Objects = sequelize.define('Objects', {
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
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss')
    }
  }, {
    tableName: 'objects',
    freezeTableName: true
  });

  Objects.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * TODO 2.0 Garde t'on le cas specifique pour les id 0 ou on n'affiche pas la rarity et la valeur ?
   * @param {("fr"|"en")} language - The language the inventory has to be displayed in
   * @param {("active"|"backup")} slot
   */
  Objects.prototype.toFieldObject = async function(language, slot) {
    return {
      name: JsonReader.models.objects.getTranslation(language)[slot].fieldName,
      value: (this.id === 0) ? this[language] : format(
          JsonReader.models.objects.getTranslation(language)[slot].fieldValue, {
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
  Objects.prototype.getRarityTranslation = function(language) {
    return JsonReader.models.item.getTranslation(language).rarities[this.rarity];
  };

  /**
   * @param {("fr"|"en")} language
   * @return {String}
   */
  Objects.prototype.getNatureTranslation = function(language) {
    return format(JsonReader.models.objects.getTranslation(language).natures[this.nature], {power: this.power});
  };

  /**
   * @return {Number}
   */
  Objects.prototype.getAttack = function() {
    if (this.nature === 3) {
      return this.power;
    }
    return 0;
  };

  /**
   * @return {Number}
   */
  Objects.prototype.getDefense = function() {
    if (this.nature === 4) {
      return this.power;
    }
    return 0;
  };

  /**
   * @return {Number}
   */
  Objects.prototype.getSpeed = function() {
    if (this.nature === 2) {
      return this.power;
    }
    return 0;
  };

  return Objects;
};
