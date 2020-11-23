/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const BreedPetCommand = async function (language, message, args) {
    [entity] = await Entities.getOrRegister(message.author.id);

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
        [EFFECT.BABY], entity)) !== true) {
        return;
    }

    let authorPet = entity.Player.Pet;
    const tr = JsonReader.commands.breedPet.getTranslation(language);

    if (!authorPet) {
        return await sendErrorMessage(message.author, message.channel, language, tr.noPet);
    }

    const cooldownTime = PETS.BREED_COOLDOWN * authorPet.PetModel.rarity - (new Date().getTime() - authorPet.hungrySince);
    if (cooldownTime > 0) {
        return sendErrorMessage(message.author, message.channel, language, format(tr.notHungry, {
            petnick: await PetEntities.displayName(authorPet, language)
        }));
    }

    let breedEmbed = new discord.MessageEmbed();
    authorPet.lovePoints += JsonReader.commands.breedPet.defaultsPoints - authorPet.PetModel.rarity;
    if (authorPet.lovePoints > PETS.MAX_LOVE_POINTS)
        authorPet.lovePoints = PETS.MAX_LOVE_POINTS;
    authorPet.hungrySince = Date();
    authorPet.save();
    breedEmbed.setAuthor(format(tr.embedTitle, { pseudo: message.author.username }), message.author.displayAvatarURL())
    breedEmbed.setDescription(format(tr.description, {
        petnick: await PetEntities.displayName(authorPet, language),
        points: JsonReader.commands.breedPet.defaultsPoints
    }));

    return await message.channel.send(breedEmbed);

};

module.exports = {
    commands: [
        {
            name: 'breedpet',
            func: BreedPetCommand,
            aliases: ['breed', 'bp', 'feedpet', 'feedp', "breedp", 'petbreed', 'pb',]
        }
    ]
};
