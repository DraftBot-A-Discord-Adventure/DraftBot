import {SmallEvent} from "./SmallEvent";
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
import {EffectsConstants} from "../constants/EffectsConstants";
import Player from "../database/game/models/Player";
import {TravelTime} from "../maps/TravelTime";
import Pet, {Pets} from "../database/game/models/Pet";
import {NumberChangeReason} from "../constants/LogsConstants";
import {LogsDatabase} from "../database/logs/LogsDatabase";
import {MissionsController} from "../missions/MissionsController";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {PetConstants} from "../constants/PetConstants";
import {Maps} from "../maps/Maps";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";

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
	let randomAnimal, randomAnimalModel;
	if (sentence.includes("{randomAnimal}")) {
		randomAnimal = await PetEntities.generateRandomPetEntityNotGuild();
		randomAnimalModel = await Pets.getById(randomAnimal.petId);
	}
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
		amount,
		food: food ? `${foodModule.get(`${food}.name`).toLowerCase()} ${Constants.PET_FOOD_GUILD_SHOP.EMOTE[getFoodIndexOf(food)]} ` : "",
		badge: Constants.BADGES.PET_TAMER,
		feminine: pet.sex === "f" ? "e" : "",
		randomAnimal: randomAnimal ? `${randomAnimal.getPetEmote(randomAnimalModel)} ${randomAnimal.getPetTypeName(randomAnimalModel, language)}` : "",
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
	if (player.badges?.includes(Constants.BADGES.PET_TAMER)) {
		delete section.badge;
	}

	// Filter if pet is already tamed
	if (petEntity.lovePoints >= PetConstants.MAX_LOVE_POINTS) {
		delete section.gainLove;
	}

	const level = petModel.rarity + (petEntity.getLoveLevelNumber() === 5 ? 1 : 0);
	const total = getRarityTotalWeight(section, level);

	return getRandomInteractionKey(section, level, total);
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
	interactionCommand: DraftbotInteraction,
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
	interactionCommand: DraftbotInteraction,
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
	case PetConstants.PET_INTERACTIONS.WIN_MONEY:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.MONEY);
		await player.addMoney(Object.assign(editValueChanges, {amount}));
		break;
	case PetConstants.PET_INTERACTIONS.WIN_HEALTH:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.HEALTH);
		await player.addHealth(amount, interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		await MissionsController.update(player, interactionCommand.channel, language, {missionId: "petEarnHealth"});
		break;
	case PetConstants.PET_INTERACTIONS.WIN_LOVE:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.LOVE_POINTS);
		await pet.changeLovePoints(Object.assign(editValueChanges, {amount}));
		break;
	case PetConstants.PET_INTERACTIONS.WIN_ENERGY:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.ENERGY);
		player.addEnergy(amount, NumberChangeReason.SMALL_EVENT);
		break;
	case PetConstants.PET_INTERACTIONS.WIN_FOOD:
		if (player.guildId) {
			food = RandomUtils.draftbotRandom.pick(Object.values(Constants.PET_FOOD));
		}
		else {
			interaction = PetConstants.PET_INTERACTIONS.NOTHING;
		}
		break;
	case PetConstants.PET_INTERACTIONS.WIN_TIME:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.TIME);
		await TravelTime.timeTravel(player, amount, NumberChangeReason.SMALL_EVENT);
		break;
	case PetConstants.PET_INTERACTIONS.WIN_POINTS:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.POINTS);
		await player.addScore(Object.assign(editValueChanges, {amount}));
		break;
	case PetConstants.PET_INTERACTIONS.WIN_BADGE:
		player.addBadge(Constants.BADGES.PET_TAMER);
		break;
	case PetConstants.PET_INTERACTIONS.LOSE_HEALTH:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.HEALTH);
		await player.addHealth(-amount, interactionCommand.channel, language, NumberChangeReason.SMALL_EVENT);
		break;
	case PetConstants.PET_INTERACTIONS.LOSE_MONEY:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.MONEY);
		await player.addMoney(Object.assign(editValueChanges, {amount: -amount}));
		break;
	case PetConstants.PET_INTERACTIONS.LOSE_TIME:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.TIME);
		await TravelTime.applyEffect(player, EffectsConstants.EMOJI_TEXT.OCCUPIED, amount, new Date(), NumberChangeReason.SMALL_EVENT);
		break;
	case PetConstants.PET_INTERACTIONS.PET_FLEE:
		LogsDatabase.logPetFree(pet).then();
		await pet.destroy();
		player.petId = null;
		break;
	case PetConstants.PET_INTERACTIONS.LOSE_LOVE:
		amount = RandomUtils.rangedInt(SmallEventConstants.PET.LOVE_POINTS);
		await pet.changeLovePoints(Object.assign(editValueChanges, {amount: -amount}));
		break;
	default:
		break;
	}
	await Promise.all([player.save(), pet.save()]);
	return {interaction, amount, food};
}

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	},

	/**
	 * Interact with your pet
	 * @param interactionCommand
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interactionCommand: DraftbotInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		if (!player.petId) {
			// The player does not have a petEntity : do nothing
			await doNothing.executeSmallEvent(interactionCommand, language, player, seEmbed);
			return;
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