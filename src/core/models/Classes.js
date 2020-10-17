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
   * @return {String}
   */
  Classes.prototype.toString = function (language) {
    return format(
      JsonReader.classesValues.getTranslation(language).fieldsValue, {
      name: this[language],
      attack: this.attack,
      defense: this.defense,
      speed: this.speed,
      health: this.health,
      fightPoint: this.fightPoint
    });
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
