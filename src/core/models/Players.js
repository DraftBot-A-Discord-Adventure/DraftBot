module.exports = (sequelize, DataTypes) => {

  const Players = sequelize.define('Players', {
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
  }, {
    tableName: 'players',
    freezeTableName: true
  });

  return Players;
};
