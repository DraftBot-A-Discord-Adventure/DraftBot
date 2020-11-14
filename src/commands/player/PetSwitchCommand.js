/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetSwitchCommand = async function (language, message, args) {
    const [entity] = await Entities.getOrRegister(message.author.id);

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
        [EFFECT.BABY], entity)) !== true) {
        return;
    }
    if (await sendBlockedError(message.author, message.channel, language)) {
        return;
    }
    let guild;
    try {
        guild = await Guilds.getById(entity.Player.guild_id);
    } catch (error) {
        guild = null;
    }
    if (!guild) {
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.guildKick.getTranslation(language).notInAguild);
    }
    const guildPetCount = guild.GuildPets.length;
    if (guildPetCount === 0) {
        return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guildShelter.getTranslation(language).noPetMessage);
    }

    if (args.length !== 1 || !RegExp(/^[0-9]*$/).test(args[0])) {
        const [server] = (await Servers.getOrRegister(message.guild.id));
        return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petSwitch.getTranslation(language).correctUsage, {
            prefix: server.prefix,
            cmd: "petswitch",
            cmdShelter: "shelter"
        }));
    }

    const petId = parseInt(args[0], 10);
    if (petId < 1 || petId > guildPetCount) {
        if (guildPetCount === 1) {
            return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.petSwitch.getTranslation(language).wrongPetNumberSingle);
        }
        return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.petSwitch.getTranslation(language).wrongPetNumberBetween, {
            max: guildPetCount
        }));
    }

    const swPet = guild.GuildPets[petId - 1];
    const swPetEntity = swPet.PetEntity;
    const pPet = entity.Player.Pet;
    if (pPet) {
        swPet.pet_entity_id = pPet.id;
        await swPet.save();
    }
    else {
        await swPet.destroy();
    }
    entity.Player.pet_id = swPetEntity.id;
    await entity.Player.save();

    const confirmEmbed = new discord.MessageEmbed();
    confirmEmbed.setTitle(JsonReader.commands.petSwitch.getTranslation(language).confirmSwitchTitle);
    if (pPet) {
        confirmEmbed.setDescription(format(JsonReader.commands.petSwitch.getTranslation(language).confirmSwitch, {
            player: message.author,
            pet1: PetEntities.getPetEmote(pPet) + " " + (pPet.nickname ? pPet.nickname : PetEntities.getPetTypeName(pPet, language)),
            pet2: PetEntities.getPetEmote(swPetEntity) + " " + (swPetEntity.nickname ? swPetEntity.nickname : PetEntities.getPetTypeName(swPetEntity, language))
        }));
    }
    else {
        confirmEmbed.setDescription(format(JsonReader.commands.petSwitch.getTranslation(language).confirmFollows, {
            player: message.author,
            pet: PetEntities.getPetEmote(swPetEntity) + " " + (swPetEntity.nickname ? swPetEntity.nickname : PetEntities.getPetTypeName(swPetEntity, language))
        }));
    }
    return message.channel.send(confirmEmbed);
}

module.exports = {
    commands: [
        {
            name: 'petswitch',
            func: PetSwitchCommand,
            aliases: ['petsw', 'psw', 'pswitch']
        }
    ]
};
