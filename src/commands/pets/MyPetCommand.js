/**
 * Displays information about the pet of a user
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const MyPetCommand = async function (language, message, args) {
    let [entity] = await Entities.getByArgs(args, message);
    if (entity === null) {
        [entity] = await Entities.getOrRegister(message.author.id);
    }

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
        [EFFECT.BABY], entity)) !== true) {
        return;
    }

    let authorPet = entity.Player.Pet;
    const tr = JsonReader.commands.myPet.getTranslation(language);

    if (authorPet) {
        const user = message.mentions.users.last() ? message.mentions.users.last() : message.author
        let mypetEmbed = new discord.MessageEmbed();
        mypetEmbed.setAuthor(format(tr.embedTitle, {
            pseudo: (await entity.Player.getPseudo(language))
        }), user.displayAvatarURL());
        mypetEmbed.setDescription(await PetEntities.getPetDisplay(authorPet, language));
        return await message.channel.send(mypetEmbed);
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
            name: 'mypet',
            func: MyPetCommand,
            aliases: ['pet', 'pp']
        }
    ]
};
