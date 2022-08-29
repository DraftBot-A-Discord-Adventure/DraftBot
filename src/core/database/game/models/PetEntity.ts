import {DataTypes, Model, QueryTypes, Sequelize} from "sequelize";
import Pet from "./Pet";
import {Constants} from "../../../Constants";
import {RandomUtils} from "../../../utils/RandomUtils";
import {Data} from "../../../Data";
import {format} from "../../../utils/StringFormatter";
import {Translations} from "../../../Translations";
import {TextBasedChannel} from "discord.js";
import {MissionsController} from "../../../missions/MissionsController";
import {finishInTimeDisplay} from "../../../utils/TimeUtils";
import {Entity} from "./Entity";
import {draftBotInstance} from "../../../bot";
import {NumberChangeReason} from "../../logs/LogsDatabase";
import moment = require("moment");

export class PetEntity extends Model {
	public readonly id!: number;

	public petId!: number;

	public sex!: string;

	public nickname: string;

	public lovePoints!: number;

	public hungrySince!: Date;

	public creationDate!: Date;

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

	public displayName(language: string): string {
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
			? Constants.PETS.LOVE_LEVEL.TRAINED : this.lovePoints >= Constants.PETS.LOVE_LEVELS[2]
				? Constants.PETS.LOVE_LEVEL.TAMED : this.lovePoints >= Constants.PETS.LOVE_LEVELS[1]
					? Constants.PETS.LOVE_LEVEL.FEARFUL : this.lovePoints >= Constants.PETS.LOVE_LEVELS[0]
						? Constants.PETS.LOVE_LEVEL.WILD : Constants.PETS.LOVE_LEVEL.FEISTY;
	}

	public async changeLovePoints(amount: number, entity: Entity, channel: TextBasedChannel, language: string, reason: NumberChangeReason): Promise<void> {
		this.lovePoints += amount;
		if (this.lovePoints >= Constants.PETS.MAX_LOVE_POINTS) {
			this.lovePoints = Constants.PETS.MAX_LOVE_POINTS;
		}
		else if (this.lovePoints < 0) {
			this.lovePoints = 0;
		}
		draftBotInstance.logsDatabase.logPetLoveChange(this, reason).then();
		await MissionsController.update(entity, channel, language, {
			missionId: "tamedPet",
			params: {loveLevel: this.getLoveLevelNumber()}
		});
		await MissionsController.update(entity, channel, language, {
			missionId: "trainedPet",
			params: {loveLevel: this.getLoveLevelNumber()}
		});
	}

	public isFeisty(): boolean {
		return this.getLoveLevelNumber() === Constants.PETS.LOVE_LEVEL.FEISTY;
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
		let randomTier = RandomUtils.draftbotRandom.realZeroToOneInclusive();
		let rarity;
		for (rarity = 1; rarity < 6; ++rarity) {
			randomTier -= data.getNumber("probabilities." + levelTier + "." + rarity);
			if (randomTier <= 0) {
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
			order: [draftBotInstance.gameDatabase.sequelize.random()]
		});
		const petEntity = PetEntity.build({
			petId: pet.id,
			sex: sex,
			nickname: null,
			lovePoints: Constants.PETS.BASE_LOVE
		});
		petEntity.PetModel = pet;
		return petEntity;
	}

	static async generateRandomPetEntityNotGuild(): Promise<PetEntity> {
		return await PetEntities.generateRandomPetEntity(Constants.PETS.GUILD_LEVEL_USED_FOR_NO_GUILD_LOOT);
	}

	static async getNbTrainedPets(): Promise<number> {
		const query = `SELECT COUNT(*) as count
                       FROM draftbot_game.pet_entities
                       WHERE lovePoints = ${Constants.PETS.MAX_LOVE_POINTS}`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0]["count"];
	}

	static async getNbFeistyPets(): Promise<number> {
		const query = `SELECT COUNT(*) as count
                       FROM draftbot_game.pet_entities
                       WHERE lovePoints <= ${Constants.PETS.LOVE_LEVELS[0]}`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0]["count"];
	}

	static async getNbPetsGivenSex(sex: string): Promise<number> {
		const query = `SELECT COUNT(*) as count
                       FROM draftbot_game.pet_entities
                       WHERE sex = :sex`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT,
			replacements: {
				sex: sex
			}
		})))[0]["count"];
	}

	static async getNbPets(): Promise<number> {
		const query = `SELECT COUNT(*) as count
                       FROM draftbot_game.pet_entities`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0]["count"];
	}
}

export function initModel(sequelize: Sequelize): void {
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
		creationDate: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW
		},
		updatedAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
		},
		createdAt: {
			type: DataTypes.DATE,
			defaultValue: moment().format("YYYY-MM-DD HH:mm:ss")
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

export function setAssociations(): void {
	PetEntity.hasOne(Pet, {
		foreignKey: "id",
		sourceKey: "petId",
		as: "PetModel"
	});
}

export default PetEntity;