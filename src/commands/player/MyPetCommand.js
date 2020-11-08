/**
 * Displays information about the profile of the player who sent the command
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

    if (args.length === 0) {
        let authorPet = entity.Player.Pet;
        const tr = JsonReader.commands.myPet.getTranslation(language);

        if (authorPet) {
            let shelterEmbed = new discord.MessageEmbed();
            shelterEmbed.setTitle(tr.embedTitle);
            shelterEmbed.addField(PetEntities.getPetTitle(authorPet, language), await PetEntities.getPetDisplay(authorPet, language));
            return await message.channel.send(shelterEmbed);
        }

        await sendErrorMessage(message.author, message.channel, language, tr.noPet);
    }
    else {
        if (await sendBlockedError(message.author, message.channel, language)) {
            return;
        }

        const server = (await Servers.getOrRegister(message.guild.id));

        switch (args[0]) {
            case 'nickname':
                if (args.length < 3) {
                    return sendArgumentsError(server, ["<nickname>", "<id>", "<nickn"]); //TODO
                }
                return;
        }

        await sendErrorMessage(message.author, message.channel, language, format(tr.unknownCommand, { prefix: server.prefix }));
    }
};

const sendArgumentsError = async (server, args) => {
    return await sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.myPet.getTranslation(language).errorArguments, {
        prefix: server.prefix,
        cmd: "pet",
        args: args.join(" ")
    }));
}

module.exports = {
    commands: [
        {
            name: 'mypet',
            func: MyPetCommand,
            aliases: ['pet']
        }
    ]
};
