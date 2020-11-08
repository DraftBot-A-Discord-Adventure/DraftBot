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

    /**
     * @param {PetEntities} pet_entity
     * @param language
     * @returns {String|string}
     */
    PetEntities.getPetTypeName = (pet_entity, language) => {
        return pet_entity.PetModel[(pet_entity.sex === 'm' ? 'male' : 'female') + "Name_" + language];
    }

    /**
     * @param {PetEntities} pet_entity
     * @returns {String|string}
     */
    PetEntities.getPetEmote = (pet_entity) => {
        return pet_entity.PetModel["emote" + (pet_entity.sex === 'm' ? 'Male' : 'Female')];
    }

    /**
     * @param {PetEntities} pet_entity
     * @param language
     * @returns {String|string}
     */
    PetEntities.getSexDisplay = (pet_entity, language) => {
        const reader = JsonReader.models.pets;
        const sex = pet_entity.sex === 'm' ? 'male' : 'female';
        return reader.getTranslation(language)[sex] + " " + reader[sex + "Emote"];
    }

    /**
     * @param {PetEntities} pet_entity
     * @param language
     * @returns {String|string}
     */
    PetEntities.getNickname = (pet_entity, language) => {
        return pet_entity.nickname ? pet_entity.nickname : JsonReader.models.pets.getTranslation(language).noNickname;
    }

    PetEntities.getPetTitle = (pet_entity, language) => {
        return format(JsonReader.commands.guildShelter.getTranslation(language).petFieldName, { id: pet_entity.id });
    }

    PetEntities.getPetDisplay = async (pet_entity, language) => {
        if (!pet_entity) {
            return await Pets.getById(JsonReader.models.pets.defaultPetId)["maleName_" + language];
        }
        return format(JsonReader.commands.guildShelter.getTranslation(language).petField, {
                emote: PetEntities.getPetEmote(pet_entity),
                type: PetEntities.getPetTypeName(pet_entity, language),
                rarity: Pets.getRarityDisplay(pet_entity.PetModel),
                sex: PetEntities.getSexDisplay(pet_entity, language),
                nickname: PetEntities.getNickname(pet_entity, language)
            }
        );
    };

    return PetEntities;
};
