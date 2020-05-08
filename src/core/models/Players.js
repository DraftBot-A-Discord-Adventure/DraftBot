module.exports = (sequelize, DataTypes) => {

  const Players = sequelize.define('players', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.score,
    },
    weeklyScore: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.weeklyScore,
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.level,
    },
    experience: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.experience,
    },
    money: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.money,
    },
    badges: {
      type: DataTypes.TEXT,
      defaultValue: JsonReader.models.players.badges,
    },
    lastReportAt: {
      type: DataTypes.DATE,
      defaultValue: JsonReader.models.players.lastReportAt
    },
    entity_id: {
      type: DataTypes.INTEGER
    },
    guild_id: {
      type: DataTypes.INTEGER,
      defaultValue: JsonReader.models.players.guild_id
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
    tableName: 'players',
    freezeTableName: true
  });

  Players.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });

  /**
   * @param {Number} score
   */
  Players.prototype.addScore = function(score) {
    this.score += score;
    this.setScore(this.score);
  };

  /**
   * @param {Number} score
   */
  Players.prototype.setScore = function(score) {
    if (score > 0) {
      this.score = score;
    } else {
      this.score = 0;
    }
  };

  /**
   * @param {Number} weeklyScore
   */
  Players.prototype.addWeeklyScore = function(weeklyScore) {
    this.weeklyScore += weeklyScore;
    this.setWeeklyScore(this.weeklyScore);
  };

  /**
   * @param {Number} weeklyScore
   */
  Players.prototype.setWeeklyScore = function(weeklyScore) {
    if (weeklyScore > 0) {
      this.weeklyScore = weeklyScore;
    } else {
      this.weeklyScore = 0;
    }
  };

  return Players;
};
