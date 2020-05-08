module.exports = (sequelize, DataTypes) => {

    const Databases = sequelize.define('Databases', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        lastResetAt: {
            type: DataTypes.DATE
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
        tableName: 'databases',
        freezeTableName: true
    });

    return Databases;
};
