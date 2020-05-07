module.exports = (sequelize, DataTypes) => {

    const Player = sequelize.define('Player', {
      discordid: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        autoIncrement: false
      },
      score: {
        type: DataTypes.INT,
        defaultValue: JsonReader.entities.player.score
      },
      weeklyScore: {
        type: DataTypes.INT,
        defaultValue: JsonReader.entities.player.weeklyScore
      },
      level: {
        type: DataTypes.INT,
        defaultValue: JsonReader.entities.player.level
      },
      experience: {
        type: DataTypes.INT,
        defaultValue: JsonReader.entities.player.experience
      },
      money: {
        type: DataTypes.INT,
        defaultValue: JsonReader.entities.player.money
      },
      lastReport: {
        type: DataTypes.INT,
        defaultValue: JsonReader.entities.player.lastReport
      },
      badges: {
        type: DataTypes.STRING(100),
        defaultValue: JsonReader.entities.server.badges
      },
      guildId: {
        type: DataTypes.STRING(64),
        defaultValue: JsonReader.entities.player.guildId
      },
      rank: {
        type: DataTypes.INT,
        defaultValue: JsonReader.entities.player.rank
      },
      weeklyRank: {
        type: DataTypes.INT,
        defaultValue: JsonReader.entities.player.weeklyRank
      },
    }, {
      tableName: 'player',
      freezeTableName: true,
      timestamps: false
    });
  
    /**
     * @return {string}
     */
    Player.prototype.echo = function() {
        return `ID: ${this.discordid}, SCORE: ${this.score}, WEEKLYSCORE: ${this.weeklyScore}, LEVEL: ${this.level}, EXPERIENCE: ${this.experience}, MONEY: ${this.money}, LAST REPORT: ${this.lastReport}, BADGES: ${this.badges}, guildId: ${this.guildId}, RANK: ${this.rank}, WEEKLY RANK: ${this.weeklyRank}`.green;
    };
  
    return Player;
  };
  