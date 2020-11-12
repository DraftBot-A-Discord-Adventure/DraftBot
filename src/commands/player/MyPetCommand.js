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
    const [server] = (await Servers.getOrRegister(message.guild.id));

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
            addPetCommandFooter(shelterEmbed, server.prefix, language);
            return await message.channel.send(shelterEmbed);
        }

        await sendErrorMessage(message.author, message.channel, language, tr.noPet);
    }
    else {
        if (await sendBlockedError(message.author, message.channel, language)) {
            return;
        }

        let guild;
        try {
            guild = await Guilds.getById(entity.Player.guild_id);
        } catch (error) {
            guild = null;
        }
        let petId = undefined;
        let pet;
        if (args.length > 1) {
            if (!RegExp(/^[0-9]*$/).test(args[1])) {
                return sendErrorMessage(message.author, message.channel, language, format(JsonReader.error.getTranslation(language).notANumber,
                    {
                        text: args[1]
                    }));
            }
            petId = parseInt(args[1], 10);
            pet = await getPetWithId(entity.Player, guild, petId);
            if (!pet) {
                return sendErrorMessage(message.author, message.channel, language, format(JsonReader.commands.myPet.getTranslation(language).dontPossess,
                    {
                        id: petId
                    }));
            }
        }

        switch (args[0]) {
            case 'nickname':
                if (args.length < 3) {
                    return sendArgumentsError(message, server, "nickname");
                }
                const petNickname = args.slice(2).join(" ");
                if (!checkNameString(petNickname, JsonReader.models.pets.nicknameMinLength, JsonReader.models.pets.nicknameMaxLength)) {
                    return sendErrorMessage(message.author, message.channel, language,
                        format(JsonReader.commands.myPet.getTranslation(language).invalidName + "\n" + JsonReader.error.getTranslation(language).nameRules, {
                            min: JsonReader.models.pets.nicknameMinLength,
                            max: JsonReader.models.pets.nicknameMaxLength,
                        }));
                }
                pet.nickname = petNickname;
                await pet.save();
                await commandSuccess(message.channel, language, "nickname", [petNickname]);
                return;
        }

        await sendErrorMessage(message.author, message.channel, language, format(tr.unknownCommand, { prefix: server.prefix }));
    }
};

const getPetWithId = async (player, guild, petId) => {
    if (player.Pet && player.Pet.id === petId) {
        return player.Pet;
    }
    if (guild) {
        for (let pet of guild.GuildPets) {
            if (pet.PetEntity.id === petId) {
                return pet.PetEntity;
            }
        }
    }
    return undefined;
}

const sendArgumentsError = async (message, server, arg) => {
    return await sendErrorMessage(message.author, message.channel, server.language, format(JsonReader.commands.myPet.getTranslation(server.language).errorArguments, {
        prefix: server.prefix,
        cmd: "pet",
        args: arg + " " + JsonReader.commands.myPet.getTranslation(server.language).idArgument + " " + JsonReader.commands.myPet.getTranslation(server.language).cmdArguments[arg]
    }));
}

const commandSuccess = async (channel, language, arg, args) => {
    const msgEmbed = new discord.MessageEmbed();
    let msg = JsonReader.commands.myPet.getTranslation(language).commandSuccess[arg];
    let replace = {};
    for (let i = 0; i < args.length; ++i) {
        replace[i + ""] = args[i];
    }
    msg = format(msg, replace);
    msgEmbed.setDescription(msg);
    msgEmbed.setTitle(JsonReader.commands.myPet.getTranslation(language).cmdSuccess);
    await channel.send(msgEmbed);
}

global.addPetCommandFooter = (embed, prefix, language) => {
    const tr = JsonReader.commands.myPet.getTranslation(language);
    let msg = "";
    const cmds = Object.keys(tr.cmdIndications);
    for (let cmd of cmds) {
        msg += tr.cmdIndications[cmd] + ": `" + prefix + "pet " + cmd + " <id> " + tr.cmdArguments[cmd] + "`\n";
    }
    embed.addField(tr.commandList, msg,false);
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
