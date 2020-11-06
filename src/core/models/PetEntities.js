/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
    const PetEntities = Sequelize.define('PetEntities', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
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
        tableName: 'pet_entities',
        freezeTableName: true,
    });

    PetEntities.beforeSave((instance) => {
        instance.setDataValue('updatedAt',
            require('moment')().format('YYYY-MM-DD HH:mm:ss'));
    });

    /**
     * @param {Number} id
     */
    PetEntities.getById = (id) => {
        return PetEntities.findOne({
            where: {
                id: id,
            },
        });
    };

    /**
     * @param {Number} pet_id
     * @param {'m'|'f'} sex
     * @param {String|string} nickname
     * @returns {Promise<PetEntities>}
     */
    PetEntities.createPet = (pet_id, sex, nickname) => {
        return PetEntities.build({
           pet_id: pet_id,
           sex: sex,
           nickname: nickname
        });
    }

    return PetEntities;
};
