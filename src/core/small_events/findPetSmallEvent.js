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

	if (Guilds.isPetShelterFull(guild) && entity.Player.pet_id != null) {
		// Plus de place
		seEmbed.setDescription(format(JsonReader.small_events.findPet.getTranslation(language).noRoom.stories[randInt(0, JsonReader.small_events.findPet.getTranslation(language).noRoom.stories.length)],{petFormat: PetEntities.displayName(pet)}));

	} else if (entity.Player.pet_id != null) {
		// Place le pet dans la guilde
		await pet.save();
		await (await GuildPets.addPet(entity.Player.guild_id, pet.id)).save();
		seEmbed.setDescription(format(JsonReader.small_events.findPet.getTranslation(language).roomInGuild.stories[randInt(0, JsonReader.small_events.findPet.getTranslation(language).roomInGuild.stories.length)],{petFormat: PetEntities.displayName(pet)}));

	} else {
		// Place le pet avec le joueur
		await pet.save();
		entity.Player.pet_id = pet.id;
		await entity.Player.save();
		seEmbed.setDescription(format(JsonReader.small_events.findPet.getTranslation(language).roomInPlayer.stories[randInt(0, JsonReader.small_events.findPet.getTranslation(language).roomInPlayer.stories.length)],{petFormat: PetEntities.displayName(pet)}));
	}

	const msg = await message.channel.send(seEmbed);
	log(entity.discordUser_id + " got find pet event.");
};

module.exports = {
	executeSmallEvent: executeSmallEvent
};