/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send.
 *    The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {GuildPets} from "../models/GuildPet";
import {PetEntities} from "../models/PetEntity";
import {Guilds} from "../models/Guild";
import {MissionsController} from "../missions/MissionsController";

const executeSmallEvent = async function(message, language, entity, seEmbed) {

	const pet = await PetEntities.generateRandomPetEntityNotGuild();
	let guild;

	// search for a user's guild
	try {
		guild = await Guilds.getById(entity.Player.guildId);
	}
	catch (error) {
		guild = null;
	}

	const petLine = await pet.displayName(language);
	const translationIntroSE = JsonReader.smallEventsIntros.getTranslation(language);
	const base = JsonReader.smallEvents.findPet.emote + " "
		+ translationIntroSE.intro[randInt(0, translationIntroSE.intro.length)];
	const noRoomInGuild = guild === null ? true : guild.isPetShelterFull();
	const seEmbedPetObtention = seEmbed;
	const trad = JsonReader.smallEvents.findPet.getTranslation(language);

	if (noRoomInGuild && entity.Player.petId !== null) {
		// no room
		let outRand;
		do {
			outRand = randInt(0, trad.noRoom.stories.length);
		}
		while (
			trad.noRoom.stories[outRand][PETS.IS_FOOD] && guild === null
		);
		// choisir une autre issue si le joueur n'a pas de guilde pour stocker la viande

		generateNoRoomEmbed(seEmbed, base, trad, petLine, pet, outRand);
		message.channel.send({ embeds: [seEmbed] });
		if (trad.noRoom.stories[outRand][PETS.IS_FOOD]) {
			await giveFood(message, language, entity, message.author, JsonReader.food.carnivorousFood, 1);
		}
	}
	else if (!noRoomInGuild && entity.Player.petId !== null) {
		// Place le pet dans la guilde
		await pet.save();
		await (await GuildPets.addPet(entity.Player.guildId, pet.id)).save();
		generateRoomEmbed(seEmbed, base, trad, petLine, pet, true);
		message.channel.send({ embeds: [seEmbed] });
		seEmbedPetObtention.setDescription(format(trad.petObtentionGuild, {
			emote: pet.getPetEmote(),
			pet: pet.getPetTypeName(language)
		}));
		await message.channel.send({ embeds: [seEmbedPetObtention] });
	}
	else {
		// Place le pet avec le joueur
		await pet.save();
		entity.Player.petId = pet.id;
		await entity.Player.save();
		generateRoomEmbed(seEmbed, base, trad, petLine, pet, false);
		message.channel.send({ embeds: [seEmbed] });
		seEmbedPetObtention.setDescription(format(trad.petObtentionPlayer, {
			emote: pet.getPetEmote(),
			pet: pet.getPetTypeName(language)
		}));
		await message.channel.send({ embeds: [seEmbedPetObtention] });
		await MissionsController.update(entity.discordUserId, message.channel, language, "havePet");
	}
	log(entity.discordUserId + " got find pet event.");
};

/**
 * generate an embed if the player does not have room
 * @param {module:"discord.js".MessageEmbed} seEmbed
 * @param base
 * @param {object} trad - all the strings for the small event
 * @param {String} petLine - pet display
 * @param {PetEntity} pet - pet info
 * @param {number} outRand - outro id
 */
const generateNoRoomEmbed = function(seEmbed, base, trad, petLine, pet, outRand) {
	seEmbed.setDescription(
		base +
		format(
			trad.noRoom.stories[outRand][0], {
				pet: petLine,
				nominative: trad.nominative[pet.sex],
				nominativeShift: trad.nominative[pet.sex].charAt(0).toUpperCase() + trad.nominative[pet.sex].slice(1),
				accusative: trad.accusative[pet.sex],
				accusativeShift: trad.accusative[pet.sex].charAt(0).toUpperCase() + trad.accusative[pet.sex].slice(1),
				determinant: trad.determinant[pet.sex],
				determinantShift: trad.determinant[pet.sex].charAt(0).toUpperCase() + trad.determinant[pet.sex].slice(1),
				feminine: pet.sex === "f" ? "e" : ""
			}));
};

/**
 * generate embed if there is room in the guild or in the inventory of the player
 * @param {module:"discord.js".MessageEmbed} seEmbed
 * @param base
 * @param {object} trad - all the strings for the small event
 * @param {String} petLine - pet display
 * @param {PetEntity} pet - pet info
 * @param {Boolean} inguild
 */
const generateRoomEmbed = function(seEmbed, base, trad, petLine, pet, inguild) {
	let text;
	if (inguild) {
		text = trad.roomInGuild.stories[randInt(0, trad.roomInGuild.stories.length)];
	}
	else {
		text = trad.roomInPlayer.stories[randInt(0, trad.roomInPlayer.stories.length)];
	}
	seEmbed.setDescription(
		base +
		format(
			text, {
				pet: petLine,
				nominative: trad.nominative[pet.sex],
				nominativeShift: trad.nominative[pet.sex].charAt(0).toUpperCase() + trad.nominative[pet.sex].slice(1),
				accusative: trad.accusative[pet.sex],
				accusativeShift: trad.accusative[pet.sex].charAt(0).toUpperCase() + trad.accusative[pet.sex].slice(1),
				determinant: trad.determinant[pet.sex],
				determinantShift: trad.determinant[pet.sex].charAt(0).toUpperCase() + trad.determinant[pet.sex].slice(1),
				feminine: pet.sex === "f" ? "e" : ""
			}));
};

module.exports = {
	smallEvent: {
		executeSmallEvent: executeSmallEvent,
		canBeExecuted: () => Promise.resolve(true)
	}
};