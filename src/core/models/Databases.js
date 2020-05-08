module.exports = (sequelize, DataTypes) => {

    const Databases = sequelize.define('Databases', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        lastResetAt: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'databases',
        freezeTableName: true
    });

    return Databases;
};
