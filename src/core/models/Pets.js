/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
    const Pets = Sequelize.define(
        "Pets",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            rarity: {
                type: DataTypes.INTEGER,
            },
            maleName_fr: {
                type: DataTypes.TEXT,
            },
            maleName_en: {
                type: DataTypes.TEXT,
            },
            femaleName_fr: {
                type: DataTypes.TEXT,
            },
            femaleName_en: {
                type: DataTypes.TEXT,
            },
            emoteMale: {
                type: DataTypes.TEXT,
            },
            emoteFemale: {
                type: DataTypes.TEXT,
            },
            diet: {
                type: DataTypes.TEXT,
                defaultValue: null,
            },
            updatedAt: {
                type: DataTypes.DATE,
                defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss"),
            },
            createdAt: {
                type: DataTypes.DATE,
                defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss"),
            },
        },
        {
            tableName: "pets",
            freezeTableName: true,
        }
    );

    Pets.beforeSave((instance) => {
        instance.setDataValue(
            "updatedAt",
            require("moment")().format("YYYY-MM-DD HH:mm:ss")
        );
    });

    /**
     * @param {Number} id
     */
    Pets.getById = (id) => {
        return Pets.findOne({
            where: {
                id: id,
            },
        });
    };

    /**
     * @returns {String|string}
     */
    Pets.getRarityDisplay = (pet) => {
        return JsonReader.models.pets.rarityEmote.repeat(pet.rarity);
    };

    return Pets;
};
