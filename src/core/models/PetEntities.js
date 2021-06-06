/**
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @typedef {import('sequelize/types')} DataTypes
 *
 * @param {Sequelize} Sequelize
 * @param {DataTypes} DataTypes
 * @returns
 */
module.exports = (Sequelize, DataTypes) => {
	const PetEntities = Sequelize.define(
		"PetEntities",
		{
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
			lovePoints: {
				type: DataTypes.INTEGER,
			},
			hungrySince: {
				type: DataTypes.DATE,
				defaultValue: JsonReader.models.pets.hungrySince,
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
			tableName: "pet_entities",
			freezeTableName: true,
		}
	);

	PetEntities.beforeSave((instance) => {
		instance.setDataValue(
			"updatedAt",
			require("moment")().format("YYYY-MM-DD HH:mm:ss")
		);
	});

	/**
	 * get a pet from its id
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
	 * create a pet entity in the database
	 * @param {Number} pet_id
	 * @param {'m'|'f'} sex
	 * @param {String|string} nickname
	 * @returns {Promise<PetEntities>}
	 */
	PetEntities.createPet = (pet_id, sex, nickname) => {
		return PetEntities.build({
			pet_id: pet_id,
			sex: sex,
			nickname: nickname,
			lovePoints: PETS.BASE_LOVE,
		});
	};

	/**
	 * get the name of the pet
	 * @param {PetEntities} pet_entity
	 * @param language
	 * @returns {String|string}
	 */
	PetEntities.getPetTypeName = (pet_entity, language) => {
		return pet_entity.PetModel[
			(pet_entity.sex === "m" ? "male" : "female") + "Name_" + language
		];
	};

	/**
	 * get the string of a pet emote
	 * @param {PetEntities} pet_entity
	 * @returns {String|string}
	 */
	PetEntities.getPetEmote = (pet_entity) => {
		return pet_entity.PetModel[
			"emote" + (pet_entity.sex === "m" ? "Male" : "Female")
		];
	};

	/**
	 * get string of pet sex
	 * @param {PetEntities} pet_entity
	 * @param language
	 * @returns {String|string}
	 */
	PetEntities.getSexDisplay = (pet_entity, language) => {
		const reader = JsonReader.models.pets;
		const sex = pet_entity.sex === "m" ? "male" : "female";
		return (
			reader.getTranslation(language)[sex] + " " + reader[sex + "Emote"]
		);
	};

	/**
	 * get pet nickname
	 * @param {PetEntities} pet_entity
	 * @param {String|string} language
	 * @returns {String|string}
	 */
	PetEntities.getNickname = (pet_entity, language) => {
		return pet_entity.nickname ? pet_entity.nickname : JsonReader.models.pets.getTranslation(language).noNickname;
	};

	/**
	 * get the love level of a pet
	 * @param {PetEntities} pet_entity
	 * @returns {Number}
	 */
	PetEntities.getLoveLevelNumber = (pet_entity) => {
		return pet_entity.lovePoints === PETS.MAX_LOVE_POINTS ? 5 : pet_entity.lovePoints > PETS.LOVE_LEVELS[2] ? 4 : pet_entity.lovePoints > PETS.LOVE_LEVELS[1] ? 3 : pet_entity.lovePoints > PETS.LOVE_LEVELS[0] ? 2 : 1;
	};

	/**
	 * get the display of the love level
	 * @param {PetEntities} pet_entity
	 * @param {String|string} language
	 * @returns {String|string}
	 */
	PetEntities.getLoveLevel = (pet_entity, language) => {
		let translations = JsonReader.models.pets.getTranslation(language);
		let loveLevel;
		if (pet_entity.lovePoints <= PETS.LOVE_LEVELS[0]) {
			loveLevel = language === LANGUAGE.FRENCH ? format(translations.loveLevels[0], {
				typeSuffix: pet_entity.sex === PETS.FEMALE ? "se" : "x"
			}) : translations.loveLevels[0];
		} else if (pet_entity.lovePoints > PETS.LOVE_LEVELS[0] && pet_entity.lovePoints <= PETS.LOVE_LEVELS[1]) {
			loveLevel = translations.loveLevels[1];
		} else if (
			pet_entity.lovePoints > PETS.LOVE_LEVELS[1] &&
			pet_entity.lovePoints <= PETS.LOVE_LEVELS[2]
		) {
			loveLevel = language === LANGUAGE.FRENCH ? format(translations.loveLevels[2], {
				typeSuffix: pet_entity.sex === PETS.FEMALE ? "ve" : "f"
			}) : translations.loveLevels[2];
		} else if (
			pet_entity.lovePoints > PETS.LOVE_LEVELS[2] &&
			pet_entity.lovePoints < PETS.MAX_LOVE_POINTS
		) {
			loveLevel = language === LANGUAGE.FRENCH ? format(translations.loveLevels[3], {
				typeSuffix: pet_entity.sex === PETS.FEMALE ? "ée" : "é"
			}) : translations.loveLevels[3];
		} else if (pet_entity.lovePoints === PETS.MAX_LOVE_POINTS) {
			loveLevel = language === LANGUAGE.FRENCH ? format(translations.loveLevels[4], {
				typeSuffix: pet_entity.sex === PETS.FEMALE ? "ée" : "é"
			}) : translations.loveLevels[4];
		}
		return loveLevel;
	};

	/**
	 * generate a title for the shelter from a pet
	 * @param {PetEntities} pet_entity
	 * @param {String|string} language
	 * @param {number} number
	 * @returns {String}
	 */
	PetEntities.getPetTitle = (pet_entity, language, number) => {
		return format(
			JsonReader.commands.guildShelter.getTranslation(language)
				.petFieldName,
			{number: number}
		);
	};

	/**
	 * generate full pet display
	 * @param {PetEntities} pet_entity
	 * @param {String|string} language
	 * @returns {Promise<String>}
	 */
	PetEntities.getPetDisplay = async (pet_entity, language) => {
		if (!pet_entity) {
			return await Pets.getById(JsonReader.models.pets.defaultPetId)[
				"maleName_" + language
			];
		}
		return format(
			JsonReader.commands.guildShelter.getTranslation(language).petField,
			{
				emote: PetEntities.getPetEmote(pet_entity),
				type: PetEntities.getPetTypeName(pet_entity, language),
				rarity: Pets.getRarityDisplay(pet_entity.PetModel),
				sex: PetEntities.getSexDisplay(pet_entity, language),
				nickname: PetEntities.getNickname(pet_entity, language),
				loveLevel: PetEntities.getLoveLevel(pet_entity, language),
			}
		);
	};

	/**
	 * generate pet name display
	 * @param {PetEntities} pet_entity
	 * @param {String|string} language
	 * @returns {Promise<String>}
	 */
	PetEntities.displayName = (pet_entity, language) => {
		let displayedName = pet_entity.nickname ? pet_entity.nickname : PetEntities.getPetTypeName(pet_entity, language);
		return PetEntities.getPetEmote(pet_entity) + " " + displayedName;
	};

	/**
	 * return a random pet
	 * @param {number} level
	 * @returns {Promise<PetEntities>}
	 */
	PetEntities.generateRandomPetEntity = async (level) => {
		const sex = draftbotRandom.bool() ? "m" : "f";
		const levelTier = "" + Math.floor(level / 10);
		const probabilities = JsonReader.models.pets.probabilities[levelTier];
		let p = draftbotRandom.realZeroToOneInclusive();
		let rarity;
		for (rarity = 1; rarity < 6; ++rarity) {
			p -= probabilities["" + rarity];
			if (p <= 0) {
				break;
			}
		}
		if (rarity === 6) {
			// Case that should never be reached if the probabilities are 1
			rarity = 1;
			console.log(
				"Warning ! Pet probabilities are not equal to 1 for level tier " +
				levelTier
			);
		}
		const pet = await Pets.findOne({
			where: {
				rarity: rarity,
			},
			order: [Sequelize.fn("RANDOM")],
		});
		let r = PetEntities.build({
			pet_id: pet.id,
			sex: sex,
			nickname: null,
			lovePoints: PETS.BASE_LOVE,
		});
		r.PetModel = pet;
		return r;
	};

	/**
	 * Génère une entité de pet
	 * @returns {Promise<PetEntities>}
	 */
	PetEntities.generateRandomPetEntityNotGuild = () => {
		return PetEntities.generateRandomPetEntity(PETS.GUILD_LEVEL_USED_FOR_NO_GUILD_LOOT);
	};

	return PetEntities;
};
