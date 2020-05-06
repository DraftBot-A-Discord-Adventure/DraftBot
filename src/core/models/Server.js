module.exports = (sequelize, DataTypes) => {

  const Server = sequelize.define('Server', {
    id: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      autoIncrement: false
    },
    prefix: DataTypes.STRING(10),
    language: DataTypes.STRING(2)
  }, {
    tableName: 'server',
    freezeTableName: true,
    timestamps: false
  });

  /**
   * @param {String} id
   * @return {Promise<[Server, boolean]>}
   */
  Server.getByIdOrCreate = async (id) => {
    return Server.findOrCreate({
      where: {id: id},
      defaults: {
        id: id,
        prefix: JsonReader.entities.server.prefix,
        language: JsonReader.entities.server.language
      }
    });
  };

  Server.prototype.echo = function() {
      return `ID: ${this.id}, PREFIX: ${this.prefix}, LANGUAGE: ${this.language}`.green;
  };

  return Server;
};
