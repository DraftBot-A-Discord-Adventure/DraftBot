/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {
	let pet = await PetEntities.generateRandomPetEntityNotGuild();
	let base = JsonReader.small_events.findPet.emote + " " + JsonReader.smallEventsIntros.getTranslation(language).intro[randInt(0, JsonReader.smallEventsIntros.getTranslation(language).intro.length)];
	let guild = await Guilds.getById(entity.Player.guild_id);
	let roomInGuild = guild == null ? false : await Guilds.isPetShelterFull(guild);
	let petLine = await PetEntities.displayName(pet, language);
	let trad = JsonReader.small_events.findPet.getTranslation(language);
	if (roomInGuild && entity.Player.pet_id != null) {
		// Plus de place
		let outRand = randInt(0, trad.noRoom.stories.length);
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
		await message.channel.send(seEmbed);
		if (trad.noRoom.stories[outRand][1]) {
			await require("../../commands/guild/GuildShopCommand").giveFood(message, language, entity, message.author, JsonReader.food.carnivorousFood, draftbotRandom.integer(1, 3));
		}
	} else if (entity.Player.pet_id != null) {
		// Place le pet dans la guilde
		await pet.save();
		await (await GuildPets.addPet(entity.Player.guild_id, pet.id)).save();
		seEmbed.setDescription(
			base +
			format(
				trad.roomInGuild.stories[randInt(0, trad.roomInGuild.stories.length)], {
					pet: petLine,
					nominative: trad.nominative[pet.sex],
					nominativeShift: trad.nominative[pet.sex].charAt(0).toUpperCase() + trad.nominative[pet.sex].slice(1),
					accusative: trad.accusative[pet.sex],
					accusativeShift: trad.accusative[pet.sex].charAt(0).toUpperCase() + trad.accusative[pet.sex].slice(1),
					determinant: trad.determinant[pet.sex],
					determinantShift: trad.determinant[pet.sex].charAt(0).toUpperCase() + trad.determinant[pet.sex].slice(1),
					feminine: pet.sex === "f" ? "e" : ""
				}));
		await message.channel.send(seEmbed);
	} else {
		// Place le pet avec le joueur
		await pet.save();
		entity.Player.pet_id = pet.id;
		await entity.Player.save();
		seEmbed.setDescription(
			base +
			format(
				trad.roomInPlayer.stories[randInt(0, trad.roomInPlayer.stories.length)], {
					pet: petLine,
					nominative: trad.nominative[pet.sex],
					nominativeShift: trad.nominative[pet.sex].charAt(0).toUpperCase() + trad.nominative[pet.sex].slice(1),
					accusative: trad.accusative[pet.sex],
					accusativeShift: trad.accusative[pet.sex].charAt(0).toUpperCase() + trad.accusative[pet.sex].slice(1),
					determinant: trad.determinant[pet.sex],
					determinantShift: trad.determinant[pet.sex].charAt(0).toUpperCase() + trad.determinant[pet.sex].slice(1),
					feminine: pet.sex === "f" ? "e" : ""
				}));
		await message.channel.send(seEmbed);
	}
	log(entity.discordUser_id + " got find pet event.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};