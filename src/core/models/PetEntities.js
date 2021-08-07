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
				autoIncrement: true
			},
			petId: {
				type: DataTypes.INTEGER
			},
			sex: {
				type: DataTypes.CHAR
			},
			nickname: {
				type: DataTypes.TEXT
			},
			lovePoints: {
				type: DataTypes.INTEGER
			},
			hungrySince: {
				type: DataTypes.DATE,
				defaultValue: JsonReader.models.pets.hungrySince
			},
			updatedAt: {
				type: DataTypes.DATE,
				defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
			},
			createdAt: {
				type: DataTypes.DATE,
				defaultValue: require("moment")().format("YYYY-MM-DD HH:mm:ss")
			}
		},
		{
			tableName: "pet_entities",
			freezeTableName: true
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
	PetEntities.getById = (id) => PetEntities.findOne({
		where: {
			id: id
		}
	});

	/**
	 * create a pet entity in the database
	 * @param {Number} petId
	 * @param {'m'|'f'} sex
	 * @param {String|string} nickname
	 * @returns {Promise<PetEntities>}
	 */
	PetEntities.createPet = (petId, sex, nickname) => PetEntities.build({
		petId: petId,
		sex: sex,
		nickname: nickname,
		lovePoints: PETS.BASE_LOVE
	});

	/**
	 * get the name of the pet
	 * @param {PetEntities} petEntity
	 * @param language
	 * @returns {String|string}
	 */
	PetEntities.getPetTypeName = (petEntity, language) => petEntity.PetModel[
		(petEntity.sex === "m" ? "male" : "female") + "Name" + language.toUpperCase().slice(0,1) + language.slice(1)
	];

	/**
	 * get the string of a pet emote
	 * @param {PetEntities} petEntity
	 * @returns {String|string}
	 */
	PetEntities.getPetEmote = (petEntity) => petEntity.PetModel[
		"emote" + (petEntity.sex === "m" ? "Male" : "Female")
	];

	/**
	 * get string of pet sex
	 * @param {PetEntities} petEntity
	 * @param language
	 * @returns {String|string}
	 */
	PetEntities.getSexDisplay = (petEntity, language) => {
		const reader = JsonReader.models.pets;
		const sex = petEntity.sex === "m" ? "male" : "female";
		return (
			reader.getTranslation(language)[sex] + " " + reader[sex + "Emote"]
		);
	};

	/**
	 * get pet nickname
	 * @param {PetEntities} petEntity
	 * @param {String|string} language
	 * @returns {String|string}
	 */
	PetEntities.getNickname = function(petEntity, language) {
		return petEntity.nickname ? petEntity.nickname : JsonReader.models.pets.getTranslation(language).noNickname;
	};

	/**
	 * get the love level of a pet
	 * @param {PetEntities} petEntity
	 * @returns {Number}
	 */
	PetEntities.getLoveLevelNumber = function(petEntity) {
		return petEntity.lovePoints === PETS.MAX_LOVE_POINTS
			? 5 : petEntity.lovePoints > PETS.LOVE_LEVELS[2]
				? 4 : petEntity.lovePoints > PETS.LOVE_LEVELS[1]
					? 3 : petEntity.lovePoints > PETS.LOVE_LEVELS[0]
						? 2 : 1;
	};

	/**
	 * get the display of the love level
	 * @param {PetEntities} petEntity
	 * @param {String|string} language
	 * @returns {String|string}
	 */
	PetEntities.getLoveLevel = (petEntity, language) => {
		const translations = JsonReader.models.pets.getTranslation(language);
		let loveLevel;
		if (petEntity.lovePoints <= PETS.LOVE_LEVELS[0]) {
			loveLevel = language === LANGUAGE.FRENCH ? format(translations.loveLevels[0], {
				typeSuffix: petEntity.sex === PETS.FEMALE ? "se" : "x"
			}) : translations.loveLevels[0];
		}
		else if (petEntity.lovePoints > PETS.LOVE_LEVELS[0] && petEntity.lovePoints <= PETS.LOVE_LEVELS[1]) {
			loveLevel = translations.loveLevels[1];
		}
		else if (
			petEntity.lovePoints > PETS.LOVE_LEVELS[1] &&
			petEntity.lovePoints <= PETS.LOVE_LEVELS[2]
		) {
			loveLevel = language === LANGUAGE.FRENCH ? format(translations.loveLevels[2], {
				typeSuffix: petEntity.sex === PETS.FEMALE ? "ve" : "f"
			}) : translations.loveLevels[2];
		}
		else if (
			petEntity.lovePoints > PETS.LOVE_LEVELS[2] &&
			petEntity.lovePoints < PETS.MAX_LOVE_POINTS
		) {
			loveLevel = language === LANGUAGE.FRENCH ? format(translations.loveLevels[3], {
				typeSuffix: petEntity.sex === PETS.FEMALE ? "ée" : "é"
			}) : translations.loveLevels[3];
		}
		else if (petEntity.lovePoints === PETS.MAX_LOVE_POINTS) {
			loveLevel = language === LANGUAGE.FRENCH ? format(translations.loveLevels[4], {
				typeSuffix: petEntity.sex === PETS.FEMALE ? "ée" : "é"
			}) : translations.loveLevels[4];
		}
		return loveLevel;
	};

	/**
	 * generate a title for the shelter from a pet
	 * @param {PetEntities} petEntity
	 * @param {String|string} language
	 * @param {number} number
	 * @returns {String}
	 */
	PetEntities.getPetTitle = (petEntity, language, number) => format(
		JsonReader.commands.guildShelter.getTranslation(language)
			.petFieldName,
		{number: number}
	);

	/**
	 * generate full pet display
	 * @param {PetEntities} petEntity
	 * @param {String|string} language
	 * @returns {Promise<String>}
	 */
	PetEntities.getPetDisplay = async (petEntity, language) => {
		if (!petEntity) {
			return await Pets.getById(JsonReader.models.pets.defaultPetId)[
				"maleName" + language.toUpperCase().slice(0,1) + language.slice(1)
			];
		}
		return format(
			JsonReader.commands.guildShelter.getTranslation(language).petField,
			{
				emote: PetEntities.getPetEmote(petEntity),
				type: PetEntities.getPetTypeName(petEntity, language),
				rarity: Pets.getRarityDisplay(petEntity.PetModel),
				sex: PetEntities.getSexDisplay(petEntity, language),
				nickname: PetEntities.getNickname(petEntity, language),
				loveLevel: PetEntities.getLoveLevel(petEntity, language)
			}
		);
	};

	/**
	 * generate pet name display
	 * @param {PetEntities} petEntity
	 * @param {String|string} language
	 * @returns {Promise<String>}
	 */
	PetEntities.displayName = (petEntity, language) => {
		const displayedName = petEntity.nickname ? petEntity.nickname : PetEntities.getPetTypeName(petEntity, language);
		return PetEntities.getPetEmote(petEntity) + " " + displayedName;
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
				rarity: rarity
			},
			order: [Sequelize.fn("RANDOM")]
		});
		const r = PetEntities.build({
			petId: pet.id,
			sex: sex,
			nickname: null,
			lovePoints: PETS.BASE_LOVE
		});
		r.PetModel = pet;
		return r;
	};

	/**
	 * Génère une entité de pet
	 * @returns {Promise<PetEntities>}
	 */
	PetEntities.generateRandomPetEntityNotGuild = () => PetEntities.generateRandomPetEntity(PETS.GUILD_LEVEL_USED_FOR_NO_GUILD_LOOT);

	// ---------------------------------------------------------------------------------------------------------------------
	// PART ON botFacts Small Events
	// ---------------------------------------------------------------------------------------------------------------------
	/**
	 * Get how many pets are trained
	 * @return {Promise<Number>}
	 */
	PetEntities.getNbTrainedPets = async () => {
		const query = `SELECT COUNT(*)
		               FROM pet_entities
		               WHERE lovePoints = 100`;
		return (await Sequelize.query(query, {
			type: Sequelize.QueryTypes.SELECT
		}))[0]["COUNT(*)"];
	};

	/**
	 * Get how many pets are feisty
	 * @return {Promise<Number>}
	 */
	PetEntities.getNbFeistyPets = async () => {
		const query = `SELECT COUNT(*)	
		               FROM pet_entities
		               WHERE lovePoints <= :feistyLvl`;
		return (await Sequelize.query(query, {
			type: Sequelize.QueryTypes.SELECT,
			replacements: {
				feistyLvl: PETS.LOVE_LEVELS[0]
			}
		}))[0]["COUNT(*)"];
	};

	/**
	 * Get how many pets are of a given sex
	 * @return {Promise<Number>}
	 */
	PetEntities.getNbPetsGivenSex = async (sex) => {
		const query = `SELECT COUNT(*)	
		               FROM pet_entities
		               WHERE sex = :sex`;
		return (await Sequelize.query(query, {
			type: Sequelize.QueryTypes.SELECT,
			replacements: {
				sex: sex
			}
		}))[0]["COUNT(*)"];
	};
	/**
	 * Get how many pets are they
	 * @return {Promise<Number>}
	 */
	PetEntities.getNbPets = async () => {
		const query = `SELECT COUNT(*)	
		               FROM pet_entities`;
		return (await Sequelize.query(query, {
			type: Sequelize.QueryTypes.SELECT
		}))[0]["COUNT(*)"];
	};

	return PetEntities;
};
