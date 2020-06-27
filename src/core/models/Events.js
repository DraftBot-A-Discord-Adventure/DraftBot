module.exports = (sequelize, DataTypes) => {

  const Events = sequelize.define('Events', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    tableName: 'events',
    freezeTableName: true
  });

  Events.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @return {Promise<String[]>}
   */
  Events.prototype.getReactions = async function() {
    let possibilities = await this.getPossibilities();
    let reactions = [];
    for (const possibility of possibilities) {
      reactions.push(possibility.possibilityKey);
    }
    return reactions;
  };

  // TODO 2.0
  // async getRandom() {
  //   const id = Math.round(Math.random() * (Object.keys(this.events).length - 1)) + 1;
  //   return this.events[id];
  // }

  return Events;
};
