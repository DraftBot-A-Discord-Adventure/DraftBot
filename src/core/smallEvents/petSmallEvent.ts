import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {smallEvent as doNothing} from "./doNothingSmallEvent";
import {Constants} from "../Constants";
import {giveRandomItem} from "../utils/ItemUtils";
import {PetEntities, PetEntity} from "../database/game/models/PetEntity";
import {Data} from "../Data";
import {giveFood} from "../utils/GuildUtils";
import {getFoodIndexOf} from "../utils/FoodUtils";
import {LogsDatabase, NumberChangeReason} from "../database/logs/LogsDatabase";
import {EffectsConstants} from "../constants/EffectsConstants";
import Player from "../database/game/models/Player";
import {TravelTime} from "../maps/TravelTime";
import Pet, {Pets} from "../database/game/models/Pet";

/**
 * Allow to generate the embed that will be displayed to the player
 * @param language
 * @param interaction
 * @param seEmbed - base small event embed
 * @param pet - The pet of the player
 * @param petModel
 * @param amount - amount of stuff gained
 * @param food - food earned
 * @returns {Promise<void>}
 */
// eslint-disable-next-line max-params
async function generatePetEmbed(
	language: string,
	interaction: string,
	seEmbed: DraftBotEmbed,
	pet: PetEntity,
	petModel: Pet,
	amount: number,
	food: string
): Promise<void> {
	const tr = Translations.getModule("smallEvents.pet", language);
	const foodModule = Translations.getModule("food", language);
	const sentence = tr.getRandom(interaction);
	const randomAnimal = sentence.includes("{randomAnimal}") ? await PetEntities.generateRandomPetEntityNotGuild() : null;
	seEmbed.setDescription(format(sentence, {
		pet: `${pet.getPetEmote(petModel)} ${pet.nickname ? pet.nickname : pet.getPetTypeName(petModel, language)}`,
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
		randomAnimal: randomAnimal ? `${randomAnimal.getPetEmote(petModel)} ${randomAnimal.getPetTypeName(petModel, language)}` : "",
		randomAnimalFeminine: randomAnimal ? randomAnimal.sex === "f" ? "e" : "" : "",
		petFemale: pet.sex === "f"
	}));
}

type SectionType = { [key: string]: { minLevel: number, probabilityWeight: number } };

/**
 * Get total weight of interaction probabilities
 * @param section
 * @param level
 */
function getRarityTotalWeight(section: SectionType, level: number): number {
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
	return total;
}

/**
 * Pick a random interaction key
 * @param section
 * @param level
 * @param total
 */
function getRandomInteractionKey(section: SectionType, level: number, total: number): string {
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
 * Sélectionne une interaction aléatoire avec un pet
 * @param player - le joueur
 * @param petEntity - le pet
 * @param petModel
 * @returns {string|null} - une interaction aléatoire
 */
function pickRandomInteraction(player: Player, petEntity: PetEntity, petModel: Pet): string {
	const petData = Data.getModule("smallEvents.pet");
	// Clone with assign because we modify it after. We do not want to modify it for everyone
	const section: SectionType = Object.assign({}, (petEntity.isFeisty() ? petData.getObject("rarities.feisty") : petData.getObject("rarities.normal")) as SectionType);

	// Filter if already have badge
	if (player.badges && player.badges.includes(Constants.BADGES.PET_TAMER)) {
		delete section["badge"];
	}

	// Filter if pet is already tamed
	if (petEntity.lovePoints >= Constants.PETS.MAX_LOVE_POINTS) {
		delete section["gainLove"];
	}

	const level = petModel.rarity + (petEntity.getLoveLevelNumber() === 5 ? 1 : 0);
	const total = getRarityTotalWeight(section, level);

	return getRandomInteractionKey(section, level, total);
}

/**
 * Gives to the player the pet tamer badge, if he doesn't have it already
 * @param player
 * @param interaction
 */
async function givePetTamerBadge(player: Player, interaction: string): Promise<string> {
	if (player.badges !== null) {
		if (player.badges.includes(Constants.BADGES.PET_TAMER)) {
			interaction = "nothing";
		}
		else {
			player.addBadge(Constants.BADGES.PET_TAMER);
			await player.save();
		}
	}
	else {
		player.addBadge(Constants.BADGES.PET_TAMER);
		await player.save();
	}
	return interaction;
}

/**
 * Resolves the actions of several interactions which requires to send an embed after the small event
 * @param interaction
 * @param interactionCommand
 * @param language
 * @param player
 * @param food
 */
async function finishResolvingSpecialInteractions(
	interaction: string,
	interactionCommand: CommandInteraction,
	language: string,
	player: Player,
	food: string
): Promise<void> {
	switch (interaction) {
	case "item":
		await giveRandomItem(interactionCommand.user, interactionCommand.channel, language, player);
		break;
	case "food":
		await giveFood(interactionCommand, language, player, food, 1, NumberChangeReason.SMALL_EVENT);
		break;
	case "loseLife":
		await player.killIfNeeded(interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		break;
	default:
		break;
	}
}

/**
 * Manage the first phase of a pet interaction
 * @param player
 * @param interactionCommand
 * @param language
 * @param pet
 * @param petModel
 */
async function managePickedPetInteraction(
	player: Player,
	interactionCommand: CommandInteraction,
	language: string,
	pet: PetEntity,
	petModel: Pet
): Promise<{ interaction: string, amount: number, food: string }> {
	let interaction = pickRandomInteraction(player, pet, petModel);
	let amount = 0;
	let food = null;
	const editValueChanges = {
		player,
		channel: interactionCommand.channel,
		language,
		reason: NumberChangeReason.SMALL_EVENT
	};
	switch (interaction) {
	case "money":
		amount = RandomUtils.randInt(20, 70);
		await player.addMoney(Object.assign(editValueChanges, {amount}));
		await player.save();
		break;
	case "gainLife":
		amount = RandomUtils.randInt(1, 5);
		await player.addHealth(amount, interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		await player.save();
		break;
	case "gainLove":
		amount = RandomUtils.randInt(1, 3);
		await pet.changeLovePoints(Object.assign(editValueChanges, {amount}));
		await pet.save();
		break;
	case "food":
		if (player.guildId) {
			food = RandomUtils.draftbotRandom.pick(Object.values(Constants.PET_FOOD));
		}
		else {
			interaction = "nothing";
		}
		break;
	case "gainTime":
		amount = RandomUtils.randInt(5, 20);
		await TravelTime.timeTravel(player, amount, NumberChangeReason.SMALL_EVENT);
		await player.save();
		break;
	case "points":
		amount = RandomUtils.randInt(20, 70);
		await player.addScore(Object.assign(editValueChanges, {amount}));
		await player.save();
		break;
	case "badge":
		interaction = await givePetTamerBadge(player, interaction);
		break;
	case "loseLife":
		amount = RandomUtils.randInt(1, 5);
		await player.addHealth(-amount, interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		await player.save();
		break;
	case "loseMoney":
		amount = RandomUtils.randInt(20, 70);
		await player.addMoney(Object.assign(editValueChanges, {amount: -amount}));
		await player.save();
		break;
	case "loseTime":
		amount = RandomUtils.randInt(5, 20);
		await TravelTime.applyEffect(player, EffectsConstants.EMOJI_TEXT.OCCUPIED, amount, interactionCommand.createdAt, NumberChangeReason.SMALL_EVENT);
		await player.save();
		break;
	case "petFlee":
		LogsDatabase.logPetFree(pet).then();
		await pet.destroy();
		player.petId = null;
		await player.save();
		break;
	case "loseLove":
		amount = RandomUtils.randInt(1, 3);
		await pet.changeLovePoints(Object.assign(editValueChanges, {amount: -amount}));
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
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interactionCommand: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		if (!player.petId) {
			// the player does not have a petEntity : do nothing
			return await doNothing.executeSmallEvent(interactionCommand, language, player, seEmbed);
		}

		const petEntity = await PetEntities.getById(player.petId);
		const petModel = await Pets.getById(petEntity.petId);
		const {
			interaction,
			amount,
			food
		} = await managePickedPetInteraction(player, interactionCommand, language, petEntity, petModel);
		await generatePetEmbed(language, interaction, seEmbed, petEntity, petModel, amount, food);
		await interactionCommand.editReply({embeds: [seEmbed]});
		await finishResolvingSpecialInteractions(interaction, interactionCommand, language, player, food);
	}
};