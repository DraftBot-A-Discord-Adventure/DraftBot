/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const MyPetCommand = async function (language, message, args) {
    const [entity] = await Entities.getOrRegister(message.author.id);
    const [server] = (await Servers.getOrRegister(message.guild.id));

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL,
        [EFFECT.BABY], entity)) !== true) {
        return;
    }

    let authorPet = entity.Player.Pet;
    const tr = JsonReader.commands.myPet.getTranslation(language);

    if (authorPet) {
        let shelterEmbed = new discord.MessageEmbed();
        shelterEmbed.setTitle(tr.embedTitle);
        shelterEmbed.addField(PetEntities.getPetTitle(authorPet, language), await PetEntities.getPetDisplay(authorPet, language));
        return await message.channel.send(shelterEmbed);
    }

    await sendErrorMessage(message.author, message.channel, language, tr.noPet);

};

module.exports = {
    commands: [
        {
            name: 'mypet',
            func: MyPetCommand,
            aliases: ['pet']
        }
    ]
};
