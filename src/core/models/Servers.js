module.exports = (sequelize, DataTypes) => {

  const Servers = sequelize.define('Servers', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    prefix: {
      type: DataTypes.STRING(10),
      defaultValue: JsonReader.models.servers.prefix
    },
    language: {
      type: DataTypes.STRING(2),
      defaultValue: JsonReader.models.servers.language
    },
    discordGuild_id: {
      type: DataTypes.STRING(64)
    }
  }, {
    tableName: 'servers',
    freezeTableName: true
  });

  /**
   * @return {string}
   */
  Servers.prototype.echo = function() {
      return `ID: ${this.id}, PREFIX: ${this.prefix}, LANGUAGE: ${this.language}`.green;
  };

  return Servers;
};
