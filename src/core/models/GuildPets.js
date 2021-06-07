/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const GuildPets = Sequelize.define("GuildPets", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		guildId: {
			type: DataTypes.INTEGER
		},
		pet_entity_id: {
			type: DataTypes.CHAR
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
		}
	}, {
		tableName: "guild_pets",
		freezeTableName: true
	});

	GuildPets.beforeSave((instance) => {
		instance.setDataValue("updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss"));
	});

	/**
	 * @param guildId
	 * @param pet_entity_id
	 * @returns {Promise<GuildPets>}
	 */
	GuildPets.addPet = (guildId, pet_entity_id) => GuildPets.build({guildId: guildId, pet_entity_id: pet_entity_id});

	return GuildPets;
};
