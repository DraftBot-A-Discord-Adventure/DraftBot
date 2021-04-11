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
			nickname: nickname,
			lovePoints: PETS.BASE_LOVE,
		});
	};

	/**
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
	 * @param {PetEntities} pet_entity
	 * @returns {String|string}
	 */
	PetEntities.getPetEmote = (pet_entity) => {
		return pet_entity.PetModel[
		"emote" + (pet_entity.sex === "m" ? "Male" : "Female")
			];
	};

	/**
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
	 * @param {PetEntities} pet_entity
	 * @param {String|string} language
	 * @returns {String|string}
	 */
	PetEntities.getNickname = (pet_entity, language) => {
		return pet_entity.nickname
			? pet_entity.nickname
			: JsonReader.models.pets.getTranslation(language).noNickname;
	};

	/**
	 * @param {PetEntities} pet_entity
	 * @returns {Number}
	 */
	PetEntities.getLoveLevelNumber = (pet_entity) => {
		return pet_entity.lovePoints === PETS.MAX_LOVE_POINTS
			? 5
			: pet_entity.lovePoints > PETS.LOVE_LEVELS[2]
				? 4
				: pet_entity.lovePoints > PETS.LOVE_LEVELS[1]
					? 3
					: pet_entity.lovePoints > PETS.LOVE_LEVELS[0]
						? 2
						: 1;
	}

	/**
	 * @param {PetEntities} pet_entity
	 * @param {String|string} language
	 * @returns {String|string}
	 */
	PetEntities.getLoveLevel = (pet_entity, language) => {
		if (language === "fr" && pet_entity.sex === "f") {
			if (pet_entity.lovePoints <= PETS.LOVE_LEVELS[0])
				return JsonReader.models.pets
					.getTranslation(language)
					.lovelevels[1].slice(0, -1)
					.concat("se");
			else if (
				pet_entity.lovePoints >= PETS.LOVE_LEVELS[1] &&
				pet_entity.lovePoints <= PETS.LOVE_LEVELS[2]
			)
				return JsonReader.models.pets
					.getTranslation(language)
					.lovelevels[3].slice(0, -1)
					.concat("ve");
			else if (
				pet_entity.lovePoints >= PETS.LOVE_LEVELS[2] &&
				pet_entity.lovePoints < PETS.MAX_LOVE_POINTS
			)
				return JsonReader.models.pets
					.getTranslation(language)
					.lovelevels[4].concat("e");
			else if (pet_entity.lovePoints === PETS.MAX_LOVE_POINTS)
				return JsonReader.models.pets
					.getTranslation(language)
					.lovelevels[5].concat("e");
		}
		return JsonReader.models.pets.getTranslation(language).lovelevels[PetEntities.getLoveLevelNumber(pet_entity)];
	};

	/**
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
	 * @param {PetEntities} pet_entity
	 * @param {String|string} language
	 * @returns {Promise<String>}
	 */
	PetEntities.displayName = async (pet_entity, language) => {
		let displayedName = pet_entity.nickname
			? pet_entity.nickname
			: PetEntities.getPetTypeName(pet_entity, language);
		return PetEntities.getPetEmote(pet_entity) + " " + displayedName;
	};

	/**
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
	 * @returns {Promise<PetEntities>}
	 */
	PetEntities.generateRandomPetEntity = async () => {
		const sex = draftbotRandom.bool() ? "m" : "f";
		const pet = await Pets.findOne({
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

	return PetEntities;
};
