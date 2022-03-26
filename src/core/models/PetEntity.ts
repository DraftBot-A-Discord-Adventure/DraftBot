import {DataTypes, Model, QueryTypes, Sequelize} from "sequelize";
import Pet from "./Pet";
import {Constants} from "../Constants";
import {RandomUtils} from "../utils/RandomUtils";
import {Data} from "../Data";
import {format} from "../utils/StringFormatter";
import {Translations} from "../Translations";
import {TextBasedChannel} from "discord.js";
import {MissionsController} from "../missions/MissionsController";
import {finishInTimeDisplay} from "../utils/TimeUtils";
import moment = require("moment");

export class PetEntity extends Model {
	public readonly id!: number;

	public petId!: number;

	public sex!: string;

	public nickname: string;

	public lovePoints!: number;

	public hungrySince!: Date;

	public updatedAt!: Date;

	public createdAt!: Date;

	public PetModel: Pet;


	public getPetTypeName(language: string): string {
		const field: string = (this.sex === "m" ? "male" : "female") + "Name" + language.toUpperCase().slice(0, 1) + language.slice(1);
		return this.PetModel[field as keyof Pet];
	}

	public getFeedCooldownDisplay(language: string): string {
		if (!this.hungrySince || this.getFeedCooldown() <= 0) {
			return Translations.getModule("models.pets", language).get("hungry");
		}
		return finishInTimeDisplay(new Date(new Date().valueOf() + this.getFeedCooldown()));
	}

	public getFeedCooldown(): number {
		if (!this.hungrySince) {
			return 0;
		}
		return Constants.PETS.BREED_COOLDOWN * this.PetModel.rarity -
			(new Date().valueOf() - this.hungrySince.valueOf());
	}

	public getDietDisplay(language: string): string {
		return Translations.getModule("models.pets", language).get("diet.diet_" + this.PetModel.diet);
	}

	public getPetEmote(): string {
		return this.PetModel["emote" + (this.sex === "m" ? "Male" : "Female") as keyof Pet];
	}

	public displayName(language: string) {
		const displayedName = this.nickname ? this.nickname : this.getPetTypeName(language);
		return this.getPetEmote() + " " + displayedName;
	}

	public getPetDisplay(language: string): string {
		return Translations.getModule("commands.guildShelter", language).format("petField", {
			emote: this.getPetEmote(),
			type: this.getPetTypeName(language),
			rarity: this.PetModel.getRarityDisplay(),
			sex: this.getSexDisplay(language),
			nickname: this.getNickname(language),
			loveLevel: this.getLoveLevel(language)
		});
	}

	public getPetTitle(language: string, petNumber: number): string {
		return Translations.getModule("commands.guildShelter", language).format("petFieldName", {
			number: petNumber
		});
	}

	public getLoveLevel(language: string): string {
		const translations = Translations.getModule("models.pets", language);
		let loveLevel;
		if (this.lovePoints <= Constants.PETS.LOVE_LEVELS[0]) {
			loveLevel = language === "fr" ? format(translations.get("loveLevels.0"), {
				typeSuffix: this.sex === Constants.PETS.FEMALE ? "se" : "x"
			}) : translations.get("loveLevels.0");
		}
		else if (this.lovePoints > Constants.PETS.LOVE_LEVELS[0] && this.lovePoints <= Constants.PETS.LOVE_LEVELS[1]) {
			loveLevel = translations.get("loveLevels.1");
		}
		else if (
			this.lovePoints > Constants.PETS.LOVE_LEVELS[1] &&
			this.lovePoints <= Constants.PETS.LOVE_LEVELS[2]
		) {
			loveLevel = language === "fr" ? format(translations.get("loveLevels.2"), {
				typeSuffix: this.sex === Constants.PETS.FEMALE ? "ve" : "f"
			}) : translations.get("loveLevels.2");
		}
		else if (
			this.lovePoints > Constants.PETS.LOVE_LEVELS[2] &&
			this.lovePoints < Constants.PETS.MAX_LOVE_POINTS
		) {
			loveLevel = language === "fr" ? format(translations.get("loveLevels.3"), {
				typeSuffix: this.sex === Constants.PETS.FEMALE ? "ée" : "é"
			}) : translations.get("loveLevels.3");
		}
		else if (this.lovePoints === Constants.PETS.MAX_LOVE_POINTS) {
			loveLevel = language === "fr" ? format(translations.get("loveLevels.4"), {
				typeSuffix: this.sex === Constants.PETS.FEMALE ? "ée" : "é"
			}) : translations.get("loveLevels.4");
		}
		return loveLevel;
	}

	public getLoveLevelNumber(): number {
		return this.lovePoints === Constants.PETS.MAX_LOVE_POINTS
			? 5 : this.lovePoints > Constants.PETS.LOVE_LEVELS[2]
				? 4 : this.lovePoints > Constants.PETS.LOVE_LEVELS[1]
					? 3 : this.lovePoints > Constants.PETS.LOVE_LEVELS[0]
						? 2 : 1;
	}

	public async changeLovePoints(amount: number, discordId: string, channel: TextBasedChannel, language: string): Promise<void> {
		this.lovePoints += amount;
		if (this.lovePoints >= Constants.PETS.MAX_LOVE_POINTS) {
			this.lovePoints = Constants.PETS.MAX_LOVE_POINTS;
		}
		else if (this.lovePoints < 0) {
			this.lovePoints = 0;
		}
		await MissionsController.update(discordId, channel, language, "tamedPet", 1, {loveLevel: this.getLoveLevelNumber()});
		await MissionsController.update(discordId, channel, language, "trainedPet", 1, {loveLevel: this.getLoveLevelNumber()});
	}

	public isFeisty(): boolean {
		return this.getLoveLevelNumber() === 0;
	}

	private getNickname(language: string): string {
		return this.nickname ? this.nickname : Translations.getModule("models.pets", language).get("noNickname");
	}

	private getSexDisplay(language: string): string {
		const sex = this.sex === "m" ? "male" : "female";
		return Translations.getModule("models.pets", language).get(sex)
			+ " "
			+ Data.getModule("models.pets").getString(sex + "Emote");
	}
}

export class PetEntities {
	static async getById(id: number): Promise<PetEntity> {
		return await PetEntity.findOne({
			where: {
				id: id
			}
		});
	}

	static createPet(petId: number, sex: string, nickname: string): PetEntity {
		return PetEntity.build({
			petId: petId,
			sex: sex,
			nickname: nickname,
			lovePoints: Constants.PETS.BASE_LOVE
		});
	}

	static async generateRandomPetEntity(level: number): Promise<PetEntity> {
		const sex = RandomUtils.draftbotRandom.bool() ? "m" : "f";
		const levelTier = "" + Math.floor(level / 10);
		const data = Data.getModule("models.pets");
		let p = RandomUtils.draftbotRandom.realZeroToOneInclusive();
		let rarity;
		for (rarity = 1; rarity < 6; ++rarity) {
			p -= data.getNumber("probabilities." + levelTier + "." + rarity);
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
		const pet = await Pet.findOne({
			where: {
				rarity: rarity
			},
			order: [Sequelize.fn("RANDOM")]
		});
		const r = PetEntity.build({
			petId: pet.id,
			sex: sex,
			nickname: null,
			lovePoints: Constants.PETS.BASE_LOVE
		});
		r.PetModel = pet;
		return r;
	}

	static async generateRandomPetEntityNotGuild(): Promise<PetEntity> {
		return await PetEntities.generateRandomPetEntity(Constants.PETS.GUILD_LEVEL_USED_FOR_NO_GUILD_LOOT);
	}

	static async getNbTrainedPets(): Promise<number> {
		const query = `SELECT COUNT(*) as count
                       FROM pet_entities
                       WHERE lovePoints = 100`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0]["count"];
	}

	static async getNbFeistyPets(): Promise<number> {
		const query = `SELECT COUNT(*) as count
                       FROM pet_entities
                       WHERE lovePoints <= :feistyLvl`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements: {
				feistyLvl: Constants.PETS.LOVE_LEVELS[0]
			}
		})))[0]["count"];
	}

	static async getNbPetsGivenSex(sex: string): Promise<number> {
		const query = `SELECT COUNT(*) as count
                       FROM pet_entities
                       WHERE sex = :sex`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements: {
				sex: sex
			}
		})))[0]["count"];
	}

	static async getNbPets() {
		const query = `SELECT COUNT(*) as count
                       FROM pet_entities`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0]["count"];
	}
}

export function initModel(sequelize: Sequelize) {
	PetEntity.init({
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
			defaultValue: null
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
		sequelize,
		tableName: "pet_entities",
		freezeTableName: true
	});

	PetEntity.beforeSave(instance => {
		instance.updatedAt = moment().toDate();
	});
}

export default PetEntity;