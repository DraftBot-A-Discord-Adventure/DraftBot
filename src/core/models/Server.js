module.exports = (sequelize, DataTypes) => {

  const Server = sequelize.define('Server', {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      autoIncrement: false
    },
    prefix: {
      type: DataTypes.STRING(10),
      defaultValue: JsonReader.entities.server.prefix
    },
    language: {
      type: DataTypes.STRING(2),
      defaultValue: JsonReader.entities.server.language
    }
  }, {
    tableName: 'servers',
    freezeTableName: true,
    timestamps: false
  });

  /**
   * @return {string}
   */
  Server.prototype.echo = function() {
      return `ID: ${this.id}, PREFIX: ${this.prefix}, LANGUAGE: ${this.language}`.green;
  };

  return Server;
};
