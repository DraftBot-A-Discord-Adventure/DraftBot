/**
 * Allow to add a member to a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildShelterCommand = async (language, message, args) => {

    [entity] = await Entities.getOrRegister(message.author.id);

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity)) !== true) {
        return;
    }

    // search for a user's guild
    try {
        guild = await Guilds.getById(entity.Player.guild_id);
    } catch (error) {
        guild = null;
    }

    if (guild == null) { // not in a guild
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.guildAdd.getTranslation(language).notInAguild);
    }

    const tr = JsonReader.commands.guildShelter.getTranslation(language);
    let shelterEmbed = new discord.MessageEmbed();

    shelterEmbed.setTitle(format(tr.embedTitle, {
        guild: guild.name,
        count: guild.GuildPets.length,
        max: JsonReader.models.pets.slots
    }));

    if (guild.GuildPets.length === 0) {
        shelterEmbed.setDescription(JsonReader.commands.guildShelter.getTranslation(language).noPetMessage);
    }
    else {
        for (let pet of guild.GuildPets) {
            shelterEmbed.addField(PetEntities.getPetTitle(pet.PetEntity, language), await PetEntities.getPetDisplay(pet.PetEntity, language), true);
        }
    }

    await message.channel.send(shelterEmbed);
};

module.exports = {
    commands: [
        {
            name: 'guildshelter',
            func: GuildShelterCommand,
            aliases: ['shelter', 'pets', 'animals', 'gshelter', 'gpets', 'ganimals', 'guildpets', 'guildanimals']
        }
    ]
};
