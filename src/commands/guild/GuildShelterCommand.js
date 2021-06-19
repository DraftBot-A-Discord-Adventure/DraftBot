module.exports.help = {
	name: "shelter",
	aliases: ["guildshelter", "pets", "animals", "gshelter", "gpets", "ganimals", "guildpets", "guildanimals", "sh"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
	guildRequired: true
};

/**
 * Display the shelter of guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildShelterCommand = async (message, language, entity) => {
	const guild = await Guilds.getById(entity.Player.guildId);
	const tr = JsonReader.commands.guildShelter.getTranslation(language);
	const shelterEmbed = new discord.MessageEmbed();

	shelterEmbed.setTitle(
		format(tr.embedTitle, {
			guild: guild.name,
			count: guild.GuildPets.length,
			max: JsonReader.models.pets.slots
		})
	);

	if (guild.GuildPets.length === 0) {
		shelterEmbed.setDescription(
			JsonReader.commands.guildShelter.getTranslation(language)
				.noPetMessage
		);
		shelterEmbed.setThumbnail(JsonReader.commands.guild.icon);
	}
	else {
		for (let i = 0; i < guild.GuildPets.length; ++i) {
			const pet = guild.GuildPets[i];
			shelterEmbed.addField(
				PetEntities.getPetTitle(pet.PetEntity, language, i + 1),
				await PetEntities.getPetDisplay(pet.PetEntity, language),
				true
			);
			shelterEmbed.setThumbnail(JsonReader.commands.guild.icon);
		}
	}

	if (Guilds.isPetShelterFull(guild)) {
		shelterEmbed.setDescription(
			JsonReader.commands.guildShelter.getTranslation(language)
				.warningFull
		);
		shelterEmbed.setThumbnail(JsonReader.commands.guild.icon);
	}

	await message.channel.send(shelterEmbed);
};

module.exports.execute = GuildShelterCommand;