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
    tableName: 'servers',
    freezeTableName: true
  });

  Servers.beforeSave((instance, options) => {
    instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
  });
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
      tableName: 'servers',
      freezeTableName: true
    });
  
    Servers.beforeSave((instance, options) => {
      instance.setDataValue('updatedAt', require('moment')().format('YYYY-MM-DD HH:mm:ss'));
    });
  
    
    /**
     * @param {String} discordGuild_id
     */
    Servers.getOrRegister = (discordGuild_id) => {
      return Servers.findOrCreate({
        where: {
          discordGuild_id: discordGuild_id
        },
      });
    };
  
    return Servers;
  };
  

  return Servers;
};
