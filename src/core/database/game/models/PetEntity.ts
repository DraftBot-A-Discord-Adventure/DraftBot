import {DataTypes, Model, QueryTypes, Sequelize} from "sequelize";
import Pet, {Pets} from "./Pet";
import {Constants} from "../../../Constants";
import {RandomUtils} from "../../../utils/RandomUtils";
import {format} from "../../../utils/StringFormatter";
import {TranslationModule, Translations} from "../../../Translations";
import {MissionsController} from "../../../missions/MissionsController";
import {finishInTimeDisplay} from "../../../utils/TimeUtils";
import {draftBotInstance} from "../../../bot";
import {PET_ENTITY_GIVE_RETURN, PetEntityConstants} from "../../../constants/PetEntityConstants";
import {Player, PlayerEditValueParameters} from "./Player";
import {PetConstants} from "../../../constants/PetConstants";
import {Guild, Guilds} from "./Guild";
import {GuildPets} from "./GuildPet";
import {TextInformation} from "../../../utils/MessageUtils";
import {DraftBotEmbed} from "../../../messages/DraftBotEmbed";
import moment = require("moment");

export class PetEntity extends Model {
	declare readonly id: number;

	declare petId: number;

	declare sex: string;

	declare nickname: string;

	declare lovePoints: number;

	declare hungrySince: Date;

	declare creationDate: Date;

	declare updatedAt: Date;

	declare createdAt: Date;


	public getPetTypeName(petModel: Pet, language: string): string {
		return petModel.toString(language,this.sex === "f");
	}

	public getFeedCooldownDisplay(petModel: Pet, language: string): string {
		if (!this.hungrySince || this.getFeedCooldown(petModel) <= 0) {
			return Translations.getModule("models.pets", language).get("hungry");
		}
		return finishInTimeDisplay(new Date(new Date().valueOf() + this.getFeedCooldown(petModel)));
	}

	public getFeedCooldown(petModel: Pet): number {
		if (!this.hungrySince) {
			return 0;
		}
		return PetConstants.BREED_COOLDOWN * petModel.rarity -
			(new Date().valueOf() - this.hungrySince.valueOf());
	}

	public getPetEmote(petModel: Pet): string {
		return petModel[`emote${this.sex === "m" ? "Male" : "Female"}` as keyof Pet];
	}

	public displayName(petModel: Pet, language: string): string {
		const displayedName = this.nickname ? this.nickname : this.getPetTypeName(petModel, language);
		return `${this.getPetEmote(petModel)} ${displayedName}`;
	}

	public getPetDisplay(petModel: Pet, language: string): string {
		return Translations.getModule("commands.guildShelter", language).format("petField", {
			emote: this.getPetEmote(petModel),
			type: this.getPetTypeName(petModel, language),
			rarity: petModel.getRarityDisplay(),
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
		const loveLevel = this.getLoveLevelNumber();
		let loveLevelText;
		if (loveLevel === PetConstants.LOVE_LEVEL.FEISTY) {
			loveLevelText = language === Constants.LANGUAGE.FRENCH ? format(translations.get("loveLevels.0"), {
				typeSuffix: this.sex === PetConstants.SEX.FEMALE ? "se" : "x"
			}) : translations.get("loveLevels.0");
		}
		else if (loveLevel === PetConstants.LOVE_LEVEL.WILD) {
			loveLevelText = translations.get("loveLevels.1");
		}
		else if (loveLevel === PetConstants.LOVE_LEVEL.FEARFUL) {
			loveLevelText = language === Constants.LANGUAGE.FRENCH ? format(translations.get("loveLevels.2"), {
				typeSuffix: this.sex === PetConstants.SEX.FEMALE ? "ve" : "f"
			}) : translations.get("loveLevels.2");
		}
		else if (loveLevel === PetConstants.LOVE_LEVEL.TAMED) {
			loveLevelText = language === Constants.LANGUAGE.FRENCH ? format(translations.get("loveLevels.3"), {
				typeSuffix: this.sex === PetConstants.SEX.FEMALE ? "ée" : "é"
			}) : translations.get("loveLevels.3");
		}
		else if (loveLevel === PetConstants.LOVE_LEVEL.TRAINED) {
			loveLevelText = language === Constants.LANGUAGE.FRENCH ? format(translations.get("loveLevels.4"), {
				typeSuffix: this.sex === PetConstants.SEX.FEMALE ? "ée" : "é"
			}) : translations.get("loveLevels.4");
		}
		return loveLevelText;
	}

	public getLoveLevelNumber(): number {
		return this.lovePoints === PetConstants.MAX_LOVE_POINTS
			? PetConstants.LOVE_LEVEL.TRAINED : this.lovePoints >= PetConstants.LOVE_LEVELS[2]
				? PetConstants.LOVE_LEVEL.TAMED : this.lovePoints >= PetConstants.LOVE_LEVELS[1]
					? PetConstants.LOVE_LEVEL.FEARFUL : this.lovePoints >= PetConstants.LOVE_LEVELS[0]
						? PetConstants.LOVE_LEVEL.WILD : PetConstants.LOVE_LEVEL.FEISTY;
	}

	public async changeLovePoints(parameters: PlayerEditValueParameters): Promise<void> {
		this.lovePoints += parameters.amount;
		if (this.lovePoints >= PetConstants.MAX_LOVE_POINTS) {
			this.lovePoints = PetConstants.MAX_LOVE_POINTS;
		}
		else if (this.lovePoints < 0) {
			this.lovePoints = 0;
		}
		draftBotInstance.logsDatabase.logPetLoveChange(this, parameters.reason).then();
		await MissionsController.update(parameters.player, parameters.channel, parameters.language, {
			missionId: "tamedPet",
			params: {loveLevel: this.getLoveLevelNumber()}
		});
		await MissionsController.update(parameters.player, parameters.channel, parameters.language, {
			missionId: "trainedPet",
			params: {loveLevel: this.getLoveLevelNumber()}
		});
	}

	public isFeisty(): boolean {
		return this.getLoveLevelNumber() === PetConstants.LOVE_LEVEL.FEISTY;
	}

	/**
	 * Give the pet entity to a player, if no space then in their guild and if no space, don't give it.
	 * Send an embed only if send generic message is true
	 * @param player The player
	 * @param textInformation The text information
	 * @param sendGenericMessage Send a generic message which explains how the pet is earned
	 * @param replyToInteraction Reply to the interaction or send another message
	 */
	public async giveToPlayer(player: Player, textInformation: TextInformation, sendGenericMessage: boolean, replyToInteraction: boolean): Promise<PET_ENTITY_GIVE_RETURN> {
		let guild: Guild;
		let embed: DraftBotEmbed;
		let tr: TranslationModule;
		let returnValue: PET_ENTITY_GIVE_RETURN;
		let petDisplay: string;

		if (sendGenericMessage) {
			tr = Translations.getModule("models.pets", textInformation.language);
			embed = new DraftBotEmbed()
				.formatAuthor(tr.get("genericGiveTitle"), textInformation.interaction.user);
			petDisplay = this.displayName(await Pets.getById(this.petId), textInformation.language);
		}

		// search for a user's guild
		try {
			guild = await Guilds.getById(player.guildId);
		}
		catch (error) {
			guild = null;
		}

		const noRoomInGuild = guild === null ? true : guild.isPetShelterFull(await GuildPets.getOfGuild(guild.id));

		if (noRoomInGuild && player.petId !== null) {
			if (sendGenericMessage) {
				embed.setErrorColor();
				embed.setDescription(tr.get("genericGiveNoSlot"));
			}
			returnValue = PET_ENTITY_GIVE_RETURN.NO_SLOT;
		}
		else if (!noRoomInGuild && player.petId !== null) {
			await this.save();
			await GuildPets.addPet(guild, this, true).save();
			if (sendGenericMessage) {
				embed.setDescription(tr.get("genericGiveGuild"));
			}
			returnValue = PET_ENTITY_GIVE_RETURN.GUILD;
		}
		else {
			await this.save();
			player.setPet(this);
			await player.save();
			await MissionsController.update(player, textInformation.interaction.channel, textInformation.language, {missionId: "havePet"});
			if (sendGenericMessage) {
				embed.setDescription(tr.get("genericGivePlayer"));
			}
			returnValue = PET_ENTITY_GIVE_RETURN.PLAYER;
		}

		if (sendGenericMessage) {
			embed.setDescription(format(embed.data.description, {
				feminine: this.sex === "f",
				pet: petDisplay
			}));
			if (replyToInteraction) {
				await textInformation.interaction.reply({embeds: [embed]});
			}
			else {
				await textInformation.interaction.channel.send({embeds: [embed]});
			}
		}

		return returnValue;
	}

	private getNickname(language: string): string {
		return this.nickname ? this.nickname : Translations.getModule("models.pets", language).get("noNickname");
	}

	private getSexDisplay(language: string): string {
		return `${
			Translations.getModule("models.pets", language).get(this.sex === "m" ? "male" : "female")
		} ${
			this.sex === "m" ? PetEntityConstants.EMOTE.MALE : PetEntityConstants.EMOTE.FEMALE
		}`;
	}
}

export class PetEntities {
	static async getById(id: number): Promise<PetEntity> {
		return await PetEntity.findOne({
			where: {
				id
			}
		});
	}

	static createPet(petId: number, sex: string, nickname: string): PetEntity {
		return PetEntity.build({
			petId,
			sex,
			nickname,
			lovePoints: PetConstants.BASE_LOVE
		});
	}

	static async generateRandomPetEntity(level: number, minRarity = 1, maxRarity = 5): Promise<PetEntity> {
		const sex = RandomUtils.draftbotRandom.bool() ? "m" : "f";
		const levelTier = Math.floor(level / 10);
		let rarity;
		let totalProbabilities = 0;

		// Calculate max probability value
		for (rarity = minRarity; rarity <= maxRarity; ++rarity) {
			totalProbabilities += PetEntityConstants.PROBABILITIES[levelTier][rarity - 1];
		}

		let randomTier = RandomUtils.draftbotRandom.real(0, totalProbabilities, true);

		// Remove the rarity probabilities and stop when going under 0 to pick a rarity
		for (rarity = minRarity; rarity <= maxRarity; ++rarity) {
			randomTier -= PetEntityConstants.PROBABILITIES[levelTier][rarity - 1];
			if (randomTier <= 0) {
				break;
			}
		}
		if (rarity === maxRarity + 1) {
			// Case that should never be reached if the probabilities are 1
			rarity = 1;
			console.log(`Warning ! Pet probabilities are not equal to 1 for level tier ${levelTier}`);
		}
		const pet = await Pet.findOne({
			where: {
				rarity
			},
			order: [draftBotInstance.gameDatabase.sequelize.random()]
		});
		return PetEntity.build({
			petId: pet.id,
			sex,
			nickname: null,
			lovePoints: PetConstants.BASE_LOVE
		});
	}

	static async generateRandomPetEntityNotGuild(minRarity = 1, maxRarity = 5): Promise<PetEntity> {
		return await PetEntities.generateRandomPetEntity(PetConstants.GUILD_LEVEL_USED_FOR_NO_GUILD_LOOT, minRarity, maxRarity);
	}

	static async getNbTrainedPets(): Promise<number> {
		const query = `SELECT COUNT(*) as count
					   FROM pet_entities
					   WHERE lovePoints = ${PetConstants.MAX_LOVE_POINTS}`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT
		})))[0]["count"];
	}

	static async getNbFeistyPets(): Promise<number> {
		const query = `SELECT COUNT(*) as count
					   FROM pet_entities
					   WHERE lovePoints <= ${PetConstants.LOVE_LEVELS[0]}`;
		return (<{ count: number }[]>(await PetEntity.sequelize.query(query, {
			type: QueryTypes.SELECT
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

	static async getNbPets(): Promise<number> {
		const query = `SELECT COUNT(*) as count
					   FROM pet_entities`;
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

export default PetEntity;