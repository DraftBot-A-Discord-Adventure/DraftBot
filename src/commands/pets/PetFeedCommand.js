const tr = JsonReader.commands.petFeed;

/**
 * Feed your pet !
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetFeedCommand = async function (language, message, args) {
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

    if (!authorPet) {
        return await sendErrorMessage(
            message.author,
            message.channel,
            language,
            tr.getTranslation(language).noPet
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
            format(tr.getTranslation(language).notHungry, {
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
        tr.getTranslation(language).breedEmbedTitle,
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

    addBlockedPlayer(entity.discordUser_id, "petFeed");

    //Fetch the choice from the user
    collector.on("end", async (reaction) => {
        if (
            !reaction.first() ||
            reaction.first().emoji.name === MENU_REACTION.DENY
        ) {
            removeBlockedPlayer(entity.discordUser_id);
            return sendErrorMessage(
                message.author,
                message.channel,
                language,
                tr.getTranslation(language).cancelBreed
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
    if (guild[item.type] <= 0) {
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            tr.getTranslation(language).notEnoughFood
        );
    }
    pet.lovePoints += item.effect;
    if (pet.lovePoints > PETS.MAX_LOVE_POINTS)
        pet.lovePoints = PETS.MAX_LOVE_POINTS;
    guild[item.type] = guild[item.type] - 1;
    // pet.hungrySince = Date();
    await Promise.all([pet.save(), guild.save()]);
    const successEmbed = new discord.MessageEmbed();
    successEmbed.setAuthor(
        format(tr.getTranslation(language).embedTitle, {
            pseudo: message.author.username,
        }),
        message.author.displayAvatarURL()
    );
    switch (item.type) {
        case "commonFood":
            successEmbed.setDescription(
                format(tr.getTranslation(language).description["1"], {
                    petnick: await PetEntities.displayName(pet, language),
                })
            );
            break;
        case "rareFood":
            successEmbed.setDescription(
                format(tr.getTranslation(language).description["2"], {
                    petnick: await PetEntities.displayName(pet, language),
                })
            );
            break;
        case "uniqueFood":
            successEmbed.setDescription(
                format(tr.getTranslation(language).description["3"], {
                    petnick: await PetEntities.displayName(pet, language),
                })
            );
            break;
    }
    return message.channel.send(successEmbed);
}
module.exports = {
    commands: [
        {
            name: "petfeed",
            func: PetFeedCommand,
            aliases: [
                "feed",
                "pf",
                "petfeed",
                "pfeed",
                "feedp",
                "feedpet",
                "fp",
            ],
        },
    ],
};
