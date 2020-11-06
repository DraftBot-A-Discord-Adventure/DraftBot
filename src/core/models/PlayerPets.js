/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
    const PlayerPets = Sequelize.define('PlayerPets', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        slot: {
            type: DataTypes.INTEGER,
        },
        player_id: {
            type: DataTypes.INTEGER,
        },
        pet_id: {
            type: DataTypes.INTEGER,
        },
        sex: {
            type: DataTypes.CHAR,
        },
        nickname: {
            type: DataTypes.TEXT,
        },
        updatedAt: {
            type: DataTypes.DATE,
            defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
        },
        createdAt: {
            type: DataTypes.DATE,
            defaultValue: require('moment')().format('YYYY-MM-DD HH:mm:ss'),
        },
    }, {
        tableName: 'player_pets',
        freezeTableName: true,
    });

    PlayerPets.beforeSave((instance) => {
        instance.setDataValue('updatedAt',
            require('moment')().format('YYYY-MM-DD HH:mm:ss'));
    });

    /**
     * @param {Number} id
     */
    PlayerPets.getById = (id) => {
        return PlayerPets.findOne({
            where: {
                id: id,
            },
        });
    };

    /**
     * @param {Number} player_id
     */
    PlayerPets.getPlayerPets = (player_id) => {
        return PlayerPets.findAll({
            where: {
                player_id: player_id,
            },
            include: [
                {
                    model: Players,
                    as: 'PetPlayer'
                },
                {
                    model: Pets,
                    as: 'Pet'
                }
            ]
        });
    };

    return PlayerPets;
};
