import {SmallEvent} from "./SmallEvent";
import Entity from "../models/Entity";
import {CommandInteraction, TextChannel} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {Maps} from "../Maps";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {smallEvent as doNothing} from "./doNothingSmallEvent";
import {Constants} from "../Constants";
import {giveRandomItem} from "../utils/ItemUtils";
import {PetEntities, PetEntity} from "../models/PetEntity";
import {Data} from "../Data";
import {giveFood} from "../utils/GuildUtils";

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
const generatePetEmbed = async function(
	language: string,
	interaction: string,
	seEmbed: DraftBotEmbed,
	pet: PetEntity,
	amount: number,
	food: string
) {
	const tr = Translations.getModule("smallEvents.pet", language);
	const selectedItem: { type: string, emote: string, translations: { fr: { name: string }, en: { name: string } } } = food ? Data.getModule("food").getObject(food) : null;
	const sentence = tr.getRandom(interaction);
	const randomAnimal = sentence.includes("{randomAnimal}") ? await PetEntities.generateRandomPetEntityNotGuild() : null;
	seEmbed.setDescription(format(sentence, {
		pet: pet.getPetEmote() + " " + (pet.nickname ? pet.nickname : pet.getPetTypeName(language)),
		nominative: tr.get("nominative." + pet.sex),
		nominativeShift: tr.get("nominative." + pet.sex).charAt(0)
			.toUpperCase() + tr.get("nominative." + pet.sex).slice(1),
		accusative: tr.get("accusative." + pet.sex),
		accusativeShift: tr.get("accusative." + pet.sex).charAt(0)
			.toUpperCase() + tr.get("accusative." + pet.sex).slice(1),
		determinant: tr.get("determinant." + pet.sex),
		determinantShift: tr.get("determinant." + pet.sex).charAt(0)
			.toUpperCase() + tr.get("determinant." + pet.sex).slice(1),
		amount: amount,
		food: food ? language === (Constants.LANGUAGE.FRENCH ? selectedItem.translations.fr : selectedItem.translations.en).name.toLowerCase() + " " + selectedItem.emote + " " : "",
		badge: Constants.BADGES.PET_TAMER,
		feminine: pet.sex === "f" ? "e" : "",
		randomAnimal: randomAnimal ? randomAnimal.getPetEmote() + " " + randomAnimal.getPetTypeName(language) : "",
		randomAnimalFeminine: randomAnimal ? randomAnimal.sex === "f" ? "e" : "" : "",
		petFemale: pet.sex === "f"
	}));
};

/**
 * Sélectionne une interaction aléatoire avec un pet
 * @param petEntity - le pet
 * @returns {string|null} - une interaction aléatoire
 */
const pickRandomInteraction = function(petEntity: PetEntity) {
	const petData = Data.getModule("smallEvents.pet");
	const section: { [key: string]: { minLevel: number, probabilityWeight: number } } = petEntity.isFeisty() ? petData.getObject("rarities.feisty") : petData.getObject("rarities.normal");
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
};

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interactionCommand: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed): Promise<void> {
		if (!entity.Player.Pet) {
			// the player does not have a pet : do nothing
			return await doNothing.executeSmallEvent(interactionCommand, language, entity, seEmbed);
		}

		const pet = entity.Player.Pet;
		let interaction = pickRandomInteraction(entity.Player.Pet);
		let amount = 0;
		let food = null;
		switch (interaction) {
		case "money":
			amount = RandomUtils.randInt(20, 70);
			await entity.Player.addMoney(entity, amount, <TextChannel> interactionCommand.channel, language);
			await entity.Player.save();
			break;
		case "gainLife":
			amount = RandomUtils.randInt(1, 5);
			await entity.addHealth(amount, <TextChannel> interactionCommand.channel, language);
			await entity.save();
			break;
		case "gainLove":
			amount = RandomUtils.randInt(1, 3);
			await pet.changeLovePoints(amount, entity.discordUserId, <TextChannel> interactionCommand.channel, language);
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
			Maps.advanceTime(entity.Player, amount);
			await entity.Player.save();
			break;
		case "points":
			amount = RandomUtils.randInt(20, 70);
			await entity.Player.addScore(entity, amount, <TextChannel> interactionCommand.channel, language);
			await entity.Player.save();
			break;
		case "badge":
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

			break;
		case "loseLife":
			amount = RandomUtils.randInt(1, 5);
			await entity.addHealth(-amount, <TextChannel> interactionCommand.channel, language);
			await entity.save();
			break;
		case "loseMoney":
			amount = RandomUtils.randInt(20, 70);
			await entity.Player.addMoney(entity, -amount, <TextChannel> interactionCommand.channel, language);
			await entity.Player.save();
			break;
		case "loseTime":
			amount = RandomUtils.randInt(5, 20);
			await Maps.applyEffect(entity.Player, Constants.EFFECT.OCCUPIED, amount);
			await entity.Player.save();
			break;
		case "petFlee":
			await pet.destroy();
			entity.Player.petId = null;
			await entity.Player.save();
			break;
		case "loseLove":
			amount = RandomUtils.randInt(1, 3);
			await pet.changeLovePoints(-amount, entity.discordUserId, <TextChannel> interactionCommand.channel, language);
			await pet.save();
			break;
		default:
			break;
		}
		await generatePetEmbed(language, interaction, seEmbed, pet, amount, food);

		await interactionCommand.reply({ embeds: [seEmbed] });
		switch (interaction) {
		case "item":
			await giveRandomItem(interactionCommand.user, <TextChannel> interactionCommand.channel, language, entity);
			break;
		case "food":
			await giveFood(interactionCommand.channel, language, entity, interactionCommand.user, food, 1);
			break;
		case "loseLife":
			await entity.Player.killIfNeeded(entity, <TextChannel> interactionCommand.channel, language);
			break;
		default:
			break;
		}
		console.log(entity.discordUserId + " got a pet interaction");
	}
};