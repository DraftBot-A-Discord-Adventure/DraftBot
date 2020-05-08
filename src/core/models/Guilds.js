module.exports = (sequelize, DataTypes) => {

    const Guilds = sequelize.define('Guilds', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(32)
        },
        score: {
            type: DataTypes.INTEGER,
            defaultValue: JsonReader.models.guilds.score
        },
        level: {
            type: DataTypes.INTEGER,
            defaultValue: JsonReader.models.guilds.level
        },
        experience: {
            type: DataTypes.INTEGER,
            defaultValue: JsonReader.models.guilds.experience
        },
        lastDailyAt: {
            type: DataTypes.DATE,
            defaultValue: JsonReader.models.guilds.lastDailyAt
        },
        chief_id: {
            type: DataTypes.INTEGER
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: require('moment').utc().format('YYYY-MM-DD HH:mm:ss')
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: require('moment').utc().format('YYYY-MM-DD HH:mm:ss')
        }
    }, {
        tableName: 'guilds',
        freezeTableName: true
    });

    return Guilds;
};
