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
    classgroup: {
      type: DataTypes.INTEGER,
    },
    price: {
      type: DataTypes.INTEGER,
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
      attack: this.getAttackValue(level),
      defense: this.getDefenseValue(level),
      speed: this.getSpeedValue(level),
      health: this.health + level,
      price: this.price,
      classgroup: this.classgroup,
      fightPoint: this.getMaxCumulativeHealthValue(level)
    });
  };

  /**
   * @param {("fr"|"en")} language - The language the class name has to be displayed in
   * @return {String}
   */
  Classes.prototype.getName = function (language) {
    return this[language];
  };


  /**
   * @param {("fr"|"en")} language - The language the class description has to be displayed in
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
    return Math.round(this.attack + this.attack / 100 * level / 4 * level / 10);
  };

  /**
   * return the defense value of the player
   * @param {Number} level - the level of the player
   */
  Classes.prototype.getDefenseValue = function (level) {
    return Math.round(this.defense + this.defense / 100 * level / 4 * level / 10);
  };

  /**
   * return the speed value of the player
   * @param {Number} level - the level of the player
   */
  Classes.prototype.getSpeedValue = function (level) {
    return Math.round(this.speed + this.speed / 100 * level / 4 * level / 10);
  };

  /**
   * return the maxCumulativeHealth value of the player
   * @param {Number} level - the level of the player
   */
  Classes.prototype.getMaxCumulativeHealthValue = function (level) {
    return Math.round(this.fightPoint + 10 * level + level / 4 * level / 8);
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


  /**
   * @param {Number} groupId
   */
  Classes.getByGroupId = (groupId) => {
    return Classes.findAll({
      where: {
        classgroup: groupId,
      },
    });
  };

  /**
   * @param {Text} emoji
   */
  Classes.getByEmojy = (emoji) => {
    return Classes.findOne({
      where: {
        emoji: emoji,
      },
    });
  };

  return Classes;
};
