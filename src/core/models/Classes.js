/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
  const Classes = Sequelize.define('Classes', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    attack: {
      type: DataTypes.INTEGER,
    },
    defense: {
      type: DataTypes.INTEGER,
    },
    speed: {
      type: DataTypes.INTEGER,
    },
    health: {
      type: DataTypes.INTEGER,
    },
    fightPoint: {
      type: DataTypes.INTEGER,
    },
    emoji: {
      type: DataTypes.TEXT,
    },
    fr: {
      type: DataTypes.TEXT,
    },
    en: {
      type: DataTypes.TEXT,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
    },
  }, {
    tableName: 'classes',
    freezeTableName: true,
  });

  Classes.beforeSave((instance) => {
    instance.setDataValue('updatedAt',
      require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @param {("fr"|"en")} language - The language the class has to be displayed in
   * @param {Number} level - the level of the player
   * @return {String}
   */
  Classes.prototype.toString = function (language, level) {
    return format(
      JsonReader.classesValues.getTranslation(language).fieldsValue, {
      name: this[language],
      attack: this.attack + Math.round(this.attack / 100 * level),
      defense: this.defense + Math.round(this.defense / 100 * level),
      speed: this.speed + Math.round(this.speed / 100 * level),
      health: this.health + level,
      fightPoint: this.fightPoint + level * 10
    });
  };

  /**
   * @param {("fr"|"en")} language - The language the class has to be displayed in
   * @return {String}
   */
  Classes.prototype.getDescription = function (language) {
    return JsonReader.commands.class.getTranslation(language).description[this.id];
  };

  /**
   * return the attack value of the player
   * @param {Number} level - the level of the player
   */
  Classes.prototype.getAttackValue = function (level) {
    return this.attack + Math.round(this.attack / 100 * level);
  };

  /**
   * return the defense value of the player
   * @param {Number} level - the level of the player
   */
  Classes.prototype.getDefenseValue = function (level) {
    return this.defense + Math.round(this.defense / 100 * level);
  };

  /**
   * return the speed value of the player
   * @param {Number} level - the level of the player
   */
  Classes.prototype.getSpeedValue = function (level) {
    return this.speed + Math.round(this.speed / 100 * level);
  };

  /**
   * return the maxCumulativeHealth value of the player
   * @param {Number} level - the level of the player
   */
  Classes.prototype.getMaxCumulativeHealthValue = function (level) {
    return this.fightPoint + 10 * level;
  };

  /**
   * return the maxHealth value of the player
   * @param {Number} level - the level of the player
   */
  Classes.prototype.getMaxHealthValue = function (level) {
    return this.health + level;
  };

  /**
   * @param {Number} id
   */
  Classes.getById = (id) => {
    return Classes.findOne({
      where: {
        id: id,
      },
    });
  };

  return Classes;
};
