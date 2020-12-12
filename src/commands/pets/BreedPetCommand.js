/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const BreedPetCommand = async function (language, message, args) {
    [entity] = await Entities.getOrRegister(message.author.id);

    if (
        (await canPerformCommand(
            message,
            language,
            PERMISSION.ROLE.ALL,
            [EFFECT.BABY],
            entity
        )) !== true
    ) {
        return;
    }

    let authorPet = entity.Player.Pet;
    const tr = JsonReader.commands.breedPet.getTranslation(language);

    if (!authorPet) {
        return await sendErrorMessage(
            message.author,
            message.channel,
            language,
            tr.noPet
        );
    }

    const cooldownTime =
        PETS.BREED_COOLDOWN * authorPet.PetModel.rarity -
        (new Date().getTime() - authorPet.hungrySince);
    if (cooldownTime > 0) {
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            format(tr.notHungry, {
                petnick: await PetEntities.displayName(authorPet, language),
            })
        );
    }

    const foodItems = new Map()
        .set(
            GUILDSHOP.COMMON_FOOD,
            JsonReader.food.getTranslation(language).foodItems.commonFood
        )
        .set(
            GUILDSHOP.RARE_FOOD,
            JsonReader.food.getTranslation(language).foodItems.rareFood
        )
        .set(
            GUILDSHOP.UNIQUE_FOOD,
            JsonReader.food.getTranslation(language).foodItems.uniqueFood
        );
    let breedEmbed = new discord.MessageEmbed();
    breedEmbed.setAuthor(
        JsonReader.commands.breedPet.getTranslation(language).breedEmbedTitle,
        message.author.displayAvatarURL()
    );

    const breedMsg = await message.channel.send(breedEmbed);

    const filterConfirm = (reaction, user) => {
        return user.id === entity.discordUser_id && reaction.me;
    };

    const collector = breedMsg.createReactionCollector(filterConfirm, {
        time: 120000,
        max: 1,
    });

    addBlockedPlayer(entity.discordUser_id, "breedPet");

    //Fetch the choice from the user
    collector.on("end", async (reaction) => {
        if (!reaction.first()) {
            removeBlockedPlayer(entity.discordUser_id);
            return sendErrorMessage(
                message.author,
                message.channel,
                language,
                JsonReader.commands.breedPet.getTranslation(language)
                    .cancelBreed
            );
        }
        if (reaction.first().emoji.name === MENU_REACTION.DENY) {
            removeBlockedPlayer(entity.discordUser_id);
            return sendErrorMessage(
                message.author,
                message.channel,
                language,
                JsonReader.commands.breedPet.getTranslation(language)
                    .cancelBreed
            );
        }

        if (foodItems.has(reaction.first().emoji.name)) {
            const item = foodItems.get(reaction.first().emoji.name);
            removeBlockedPlayer(entity.discordUser_id);
            feedPet(message, language, entity, authorPet, item);
        }
    });

    await Promise.all([
        breedMsg.react(GUILDSHOP.COMMON_FOOD),
        breedMsg.react(GUILDSHOP.RARE_FOOD),
        breedMsg.react(GUILDSHOP.UNIQUE_FOOD),
        breedMsg.react(MENU_REACTION.DENY),
    ]);
};

async function feedPet(message, language, entity, pet, item) {
    const guild = await Guilds.getById(entity.Player.guild_id);
    if (guild[item.type] > 0) {
        pet.lovePoints += item.effect;
        if (pet.lovePoints > PETS.MAX_LOVE_POINTS)
            pet.lovePoints = PETS.MAX_LOVE_POINTS;
        guild[item.type] = guild[item.type] - 1;
        pet.hungrySince = Date();
        await Promise.all([pet.save(), guild.save()]);
        const successEmbed = new discord.MessageEmbed();
        successEmbed.setAuthor(
            format(
                JsonReader.commands.breedPet.getTranslation(language)
                    .embedTitle,
                { pseudo: message.author.username }
            ),
            message.author.displayAvatarURL()
        );
        switch (item.type) {
            case "commonFood":
                successEmbed.setDescription(
                    format(
                        JsonReader.commands.breedPet.getTranslation(language)
                            .description["1"],
                        {
                            petnick: await PetEntities.displayName(
                                pet,
                                language
                            ),
                        }
                    )
                );
                break;
            case "rareFood":
                successEmbed.setDescription(
                    format(
                        JsonReader.commands.breedPet.getTranslation(language)
                            .description["2"],
                        {
                            petnick: await PetEntities.displayName(
                                pet,
                                language
                            ),
                        }
                    )
                );
                break;
            case "uniqueFood":
                successEmbed.setDescription(
                    format(
                        JsonReader.commands.breedPet.getTranslation(language)
                            .description["3"],
                        {
                            petnick: await PetEntities.displayName(
                                pet,
                                language
                            ),
                        }
                    )
                );
                break;
        }
        return message.channel.send(successEmbed);
    } else {
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.breedPet.getTranslation(language).notEnoughFood
        );
    }
}
module.exports = {
    commands: [
        {
            name: "breedpet",
            func: BreedPetCommand,
            aliases: [
                "breed",
                "bp",
                "feedpet",
                "feedp",
                "breedp",
                "petbreed",
                "pb",
            ],
        },
    ],
};
