/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const BreedPetCommand = async function (language, message, args) {
    let [entity] = await Entities.getByArgs(args, message);
    if (entity === null) {
        [entity] = await Entities.getOrRegister(message.author.id);
    }

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
        [EFFECT.BABY], entity)) !== true) {
        return;
    }

    let authorPet = entity.Player.Pet;
    const tr = JsonReader.commands.breedPet.getTranslation(language);

    if (authorPet) {
        let breedEmbed = new discord.MessageEmbed();
        breedEmbed.setAuthor(format(tr.embedTitle, { pseudo: message.author.username }), message.author.displayAvatarURL())
        breedEmbed.setDescription(format(tr.description, {
            petnick: await PetEntities.displayName(authorPet, language),
            points: JsonReader.commands.breedPet.defaultsPoints
        }));
        return await message.channel.send(breedEmbed);
    }

    if (entity.discordUser_id === message.author.id) {
        await sendErrorMessage(message.author, message.channel, language, tr.noPet);
    }
    else {
        await sendErrorMessage(message.author, message.channel, language, tr.noPetOther);
    }

};

module.exports = {
    commands: [
        {
            name: 'breedpet',
            func: BreedPetCommand,
            aliases: ['breed', 'bp']
        }
    ]
};
