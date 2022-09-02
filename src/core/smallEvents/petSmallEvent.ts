import {SmallEvent} from "./SmallEvent";
import Entity from "../database/game/models/Entity";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {Maps} from "../Maps";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {smallEvent as doNothing} from "./doNothingSmallEvent";
import {Constants} from "../Constants";
import {giveRandomItem} from "../utils/ItemUtils";
import {PetEntities, PetEntity} from "../database/game/models/PetEntity";
import {Data} from "../Data";
import {giveFood} from "../utils/GuildUtils";
import {getFoodIndexOf} from "../utils/FoodUtils";
import {NumberChangeReason} from "../database/logs/LogsDatabase";
import {draftBotInstance} from "../bot";
import {EffectsConstants} from "../constants/EffectsConstants";

/**
 * Allow to generate the embed that will be displayed to the player
 * @param language
 * @param interaction
 * @param seEmbed - base small event embed
 * @param pet - The pet of the player
 * @param amount - amount of stuff gained
 * @param food - food earned
 * @returns {Promise<void>}
 */
async function generatePetEmbed(
	language: string,
	interaction: string,
	seEmbed: DraftBotEmbed,
	pet: PetEntity,
	amount: number,
	food: string
): Promise<void> {
	const tr = Translations.getModule("smallEvents.pet", language);
	const foodModule = Translations.getModule("food", language);
	const sentence = tr.getRandom(interaction);
	const randomAnimal = sentence.includes("{randomAnimal}") ? await PetEntities.generateRandomPetEntityNotGuild() : null;
	seEmbed.setDescription(format(sentence, {
		pet: `${pet.getPetEmote()} ${pet.nickname ? pet.nickname : pet.getPetTypeName(language)}`,
		nominative: tr.get(`nominative.${pet.sex}`),
		nominativeShift: tr.get(`nominative.${pet.sex}`).charAt(0)
			.toUpperCase() + tr.get(`nominative.${pet.sex}`).slice(1),
		accusative: tr.get(`accusative.${pet.sex}`),
		accusativeShift: tr.get(`accusative.${pet.sex}`).charAt(0)
			.toUpperCase() + tr.get(`accusative.${pet.sex}`).slice(1),
		determinant: tr.get(`determinant.${pet.sex}`),
		determinantShift: tr.get(`determinant.${pet.sex}`).charAt(0)
			.toUpperCase() + tr.get(`determinant.${pet.sex}`).slice(1),
		amount: amount,
		food: food ? `${foodModule.get(`${food}.name`).toLowerCase()} ${Constants.PET_FOOD_GUILD_SHOP.EMOTE[getFoodIndexOf(food)]} ` : "",
		badge: Constants.BADGES.PET_TAMER,
		feminine: pet.sex === "f" ? "e" : "",
		randomAnimal: randomAnimal ? `${randomAnimal.getPetEmote()} ${randomAnimal.getPetTypeName(language)}` : "",
		randomAnimalFeminine: randomAnimal ? randomAnimal.sex === "f" ? "e" : "" : "",
		petFemale: pet.sex === "f"
	}));
}

type SectionType = { [key: string]: { minLevel: number, probabilityWeight: number } };

/**
 * Sélectionne une interaction aléatoire avec un pet
 * @param petEntity - le pet
 * @returns {string|null} - une interaction aléatoire
 */
function pickRandomInteraction(petEntity: PetEntity): string {
	const petData = Data.getModule("smallEvents.pet");
	const section: SectionType = (petEntity.isFeisty() ? petData.getObject("rarities.feisty") : petData.getObject("rarities.normal")) as SectionType;
	const level = petEntity.PetModel.rarity + (petEntity.getLoveLevelNumber() === 5 ? 1 : 0);

	let total = 0;
	for (const key in section) {
		if (Object.prototype.hasOwnProperty.call(section, key)) {
			if (section[key].minLevel) {
				if (section[key].minLevel <= level) {
					total += section[key].probabilityWeight;
				}
			}
			else {
				total += section[key].probabilityWeight;
			}
		}
	}

	const pickedNumber = RandomUtils.randInt(0, total);
	let cumulative = 0;

	for (const key in section) {
		if (Object.prototype.hasOwnProperty.call(section, key)) {
			if (section[key].minLevel) {
				if (section[key].minLevel <= level) {
					if (pickedNumber < cumulative + section[key].probabilityWeight) {
						return key;
					}
					cumulative += section[key].probabilityWeight;
				}
			}
			else if (pickedNumber < cumulative + section[key].probabilityWeight) {
				return key;
			}
			else {
				cumulative += section[key].probabilityWeight;
			}
		}
	}
	return null;
}

/**
 * Gives to the entity the pet tamer badge, if he doesn't have it already
 * @param entity
 * @param interaction
 */
async function givePetTamerBadge(entity: Entity, interaction: string): Promise<string> {
	if (entity.Player.badges !== null) {
		if (entity.Player.badges.includes(Constants.BADGES.PET_TAMER)) {
			interaction = "nothing";
		}
		else {
			entity.Player.addBadge(Constants.BADGES.PET_TAMER);
			await entity.Player.save();
		}
	}
	else {
		entity.Player.addBadge(Constants.BADGES.PET_TAMER);
		await entity.Player.save();
	}
	return interaction;
}

/**
 * Resolves the actions of several interactions which requires to send an embed after the small event
 * @param interaction
 * @param interactionCommand
 * @param language
 * @param entity
 * @param food
 */
async function finishResolvingSpecialInteractions(
	interaction: string,
	interactionCommand: CommandInteraction,
	language: string,
	entity: Entity,
	food: string
): Promise<void> {
	switch (interaction) {
	case "item":
		await giveRandomItem(interactionCommand.user, interactionCommand.channel, language, entity);
		break;
	case "food":
		await giveFood(interactionCommand, language, entity, food, 1, NumberChangeReason.SMALL_EVENT);
		break;
	case "loseLife":
		await entity.Player.killIfNeeded(entity, interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		break;
	default:
		break;
	}
}

/**
 * Manage the first phase of a pet interaction
 * @param entity
 * @param interactionCommand
 * @param language
 * @param pet
 */
async function managePickedPetInteraction(
	entity: Entity,
	interactionCommand: CommandInteraction,
	language: string,
	pet: PetEntity
): Promise<{ interaction: string, amount: number, food: string }> {
	let interaction = pickRandomInteraction(entity.Player.Pet);
	let amount = 0;
	let food = null;
	switch (interaction) {
	case "money":
		amount = RandomUtils.randInt(20, 70);
		await entity.Player.addMoney({
			entity,
			amount,
			channel: interactionCommand.channel,
			language,
			reason: NumberChangeReason.SMALL_EVENT
		});
		await entity.Player.save();
		break;
	case "gainLife":
		amount = RandomUtils.randInt(1, 5);
		await entity.addHealth(amount, interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		await entity.save();
		break;
	case "gainLove":
		amount = RandomUtils.randInt(1, 3);
		await pet.changeLovePoints(amount, entity, interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		await pet.save();
		break;
	case "food":
		if (entity.Player.guildId) {
			food = RandomUtils.draftbotRandom.pick(Object.values(Constants.PET_FOOD));
		}
		else {
			interaction = "nothing";
		}
		break;
	case "gainTime":
		amount = RandomUtils.randInt(5, 20);
		await Maps.advanceTime(entity.Player, amount, NumberChangeReason.SMALL_EVENT);
		await entity.Player.save();
		break;
	case "points":
		amount = RandomUtils.randInt(20, 70);
		await entity.Player.addScore({
			entity,
			amount,
			channel: interactionCommand.channel,
			language,
			reason: NumberChangeReason.SMALL_EVENT
		});
		await entity.Player.save();
		break;
	case "badge":
		interaction = await givePetTamerBadge(entity, interaction);
		break;
	case "loseLife":
		amount = RandomUtils.randInt(1, 5);
		await entity.addHealth(-amount, interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		await entity.save();
		break;
	case "loseMoney":
		amount = RandomUtils.randInt(20, 70);
		await entity.Player.addMoney({
			entity,
			amount: -amount,
			channel: interactionCommand.channel,
			language,
			reason: NumberChangeReason.SMALL_EVENT
		});
		await entity.Player.save();
		break;
	case "loseTime":
		amount = RandomUtils.randInt(5, 20);
		await Maps.applyEffect(entity.Player, EffectsConstants.EMOJI_TEXT.OCCUPIED, amount, NumberChangeReason.SMALL_EVENT);
		await entity.Player.save();
		break;
	case "petFlee":
		draftBotInstance.logsDatabase.logPetFree(pet).then();
		await pet.destroy();
		entity.Player.petId = null;
		await entity.Player.save();
		break;
	case "loseLove":
		amount = RandomUtils.randInt(1, 3);
		await pet.changeLovePoints(-amount, entity, interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		await pet.save();
		break;
	default:
		break;
	}
	return {interaction, amount, food};
}

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Interact with your pet
	 * @param interactionCommand
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	async executeSmallEvent(interactionCommand: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		if (!entity.Player.Pet) {
			// the player does not have a pet : do nothing
			return await doNothing.executeSmallEvent(interactionCommand, language, entity, seEmbed);
		}

		const pet = entity.Player.Pet;
		const {interaction, amount, food} = await managePickedPetInteraction(entity, interactionCommand, language, pet);
		await generatePetEmbed(language, interaction, seEmbed, pet, amount, food);
		await interactionCommand.reply({embeds: [seEmbed]});
		await finishResolvingSpecialInteractions(interaction, interactionCommand, language, entity, food);
	}
};