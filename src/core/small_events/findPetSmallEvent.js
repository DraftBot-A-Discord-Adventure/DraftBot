/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send. The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
const executeSmallEvent = async function (message, language, entity, seEmbed) {
	let pet = await PetEntities.generateRandomPetEntity();
	let base = JsonReader.small_events.findPet.emote + JsonReader.smallEventsIntros.getTranslation(language).intro[randInt(0, JsonReader.smallEventsIntros.getTranslation(language).intro.length)];
	if (Guilds.isPetShelterFull(guild) && entity.Player.pet_id != null) {
		// Plus de place
		seEmbed.setDescription(
			base +
			format(
				JsonReader.small_events.findPet.getTranslation(language).noRoom.stories[randInt(0, JsonReader.small_events.findPet.getTranslation(language).noRoom.stories.length)], {
					pet: PetEntities.displayName(pet),
					nominative: JsonReader.small_events.findPet.getTranslation(language).nominative[pet.sex],
					nominativeShift: JsonReader.small_events.findPet.getTranslation(language).nominative[pet.sex].charAt(0).toUpperCase() + JsonReader.small_events.findPet.getTranslation(language).nominative[pet.sex].slice(1),
					accusative: JsonReader.small_events.findPet.getTranslation(language).accusative[pet.sex],
					accusativeShift: JsonReader.small_events.findPet.getTranslation(language).accusative[pet.sex].charAt(0).toUpperCase() + JsonReader.small_events.findPet.getTranslation(language).accusative[pet.sex].slice(1),
					determinant: JsonReader.small_events.findPet.getTranslation(language).determinant[pet.sex],
					determinantShift: JsonReader.small_events.findPet.getTranslation(language).determinant[pet.sex].charAt(0).toUpperCase() + JsonReader.small_events.findPet.getTranslation(language).determinant[pet.sex].slice(1),
					feminine: pet.sex === "f" ? "e" : ""
				}));

	} else if (entity.Player.pet_id != null) {
		// Place le pet dans la guilde
		await pet.save();
		await (await GuildPets.addPet(entity.Player.guild_id, pet.id)).save();
		seEmbed.setDescription(
			base +
			format(
				JsonReader.small_events.findPet.getTranslation(language).roomInGuild.stories[randInt(0, JsonReader.small_events.findPet.getTranslation(language).roomInGuild.stories.length)], {
					petFormat: PetEntities.displayName(pet),
					nominative: JsonReader.small_events.findPet.getTranslation(language).nominative[pet.sex],
					nominativeShift: JsonReader.small_events.findPet.getTranslation(language).nominative[pet.sex].charAt(0).toUpperCase() + JsonReader.small_events.findPet.getTranslation(language).nominative[pet.sex].slice(1),
					accusative: JsonReader.small_events.findPet.getTranslation(language).accusative[pet.sex],
					accusativeShift: JsonReader.small_events.findPet.getTranslation(language).accusative[pet.sex].charAt(0).toUpperCase() + JsonReader.small_events.findPet.getTranslation(language).accusative[pet.sex].slice(1),
					determinant: JsonReader.small_events.findPet.getTranslation(language).determinant[pet.sex],
					determinantShift: JsonReader.small_events.findPet.getTranslation(language).determinant[pet.sex].charAt(0).toUpperCase() + JsonReader.small_events.findPet.getTranslation(language).determinant[pet.sex].slice(1),
					feminine: pet.sex === "f" ? "e" : ""
				}));
	} else {
		// Place le pet avec le joueur
		await pet.save();
		entity.Player.pet_id = pet.id;
		await entity.Player.save();
		seEmbed.setDescription(
			base +
			format(
				JsonReader.small_events.findPet.getTranslation(language).roomInPlayer.stories[randInt(0, JsonReader.small_events.findPet.getTranslation(language).roomInPlayer.stories.length)], {
					petFormat: PetEntities.displayName(pet),
					nominative: JsonReader.small_events.findPet.getTranslation(language).nominative[pet.sex],
					nominativeShift: JsonReader.small_events.findPet.getTranslation(language).nominative[pet.sex].charAt(0).toUpperCase() + JsonReader.small_events.findPet.getTranslation(language).nominative[pet.sex].slice(1),
					accusative: JsonReader.small_events.findPet.getTranslation(language).accusative[pet.sex],
					accusativeShift: JsonReader.small_events.findPet.getTranslation(language).accusative[pet.sex].charAt(0).toUpperCase() + JsonReader.small_events.findPet.getTranslation(language).accusative[pet.sex].slice(1),
					determinant: JsonReader.small_events.findPet.getTranslation(language).determinant[pet.sex],
					determinantShift: JsonReader.small_events.findPet.getTranslation(language).determinant[pet.sex].charAt(0).toUpperCase() + JsonReader.small_events.findPet.getTranslation(language).determinant[pet.sex].slice(1),
					feminine: pet.sex === "f" ? "e" : ""
				}));
	}
	const msg = await message.channel.send(seEmbed);
	log(entity.discordUser_id + " got find pet event.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};