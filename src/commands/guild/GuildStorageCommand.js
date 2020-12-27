/**
 * Display the storage of the guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildStorageCommand = async (language, message, args) => {
    [entity] = await Entities.getOrRegister(message.author.id);

    if (
        (await canPerformCommand(
            message,
            language,
            PERMISSION.ROLE.ALL,
            [EFFECT.BABY, EFFECT.DEAD],
            entity
        )) !== true
    ) {
        return;
    }

    const foodInfos = JsonReader.food;
    const translations = JsonReader.commands.guildInventory.getTranslation(
        language
    );
    // search for a user's guild
    let guild;
    try {
        guild = await Guilds.getById(entity.Player.guild_id);
    } catch (error) {
        guild = null;
    }

    if (guild == null) {
        // not in a guild
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            translations.notInAguild
        );
    }

    let storageEmbed = new discord.MessageEmbed();

    storageEmbed.setTitle(
        format(translations.embedTitle, {
            guild: guild.name,
        })
    );

    storageEmbed.setThumbnail(JsonReader.commands.guild.icon);

    storageEmbed.addField(
        translations.fieldDescKey,
        translations.fieldDescValue
    );
    storageEmbed.addField(
        format(translations.foodTitle, {
            foodType: foodInfos.commonFood.translations[language].name,
            emote: foodInfos.commonFood.emote,
        }),
        format(translations.foodField, {
            guildFood: guild.commonFood,
            maxFood: GUILD.MAX_COMMON_PETFOOD,
        }),
        true
    );
    storageEmbed.addField(
        format(translations.foodTitle, {
            foodType: foodInfos.herbivorousFood.translations[language].name,
            emote: foodInfos.herbivorousFood.emote,
        }),
        format(translations.foodField, {
            guildFood: guild.herbivorousFood,
            maxFood: GUILD.MAX_HERBIVOROUS_PETFOOD,
        }),
        true
    );
    storageEmbed.addField(
        format(translations.foodTitle, {
            foodType: foodInfos.carnivorousFood.translations[language].name,
            emote: foodInfos.carnivorousFood.emote,
        }),
        format(translations.foodField, {
            guildFood: guild.carnivorousFood,
            maxFood: GUILD.MAX_CARNIVOROUS_PETFOOD,
        }),
        true
    );
    storageEmbed.addField(
        format(translations.foodTitle, {
            foodType: foodInfos.ultimateFood.translations[language].name,
            emote: foodInfos.ultimateFood.emote,
        }),
        format(translations.foodField, {
            guildFood: guild.ultimateFood,
            maxFood: GUILD.MAX_ULTIMATE_PETFOOD,
        }),
        true
    );

    await message.channel.send(storageEmbed);
};

module.exports = {
    commands: [
        {
            name: "guildstorage",
            func: GuildStorageCommand,
            aliases: ["guildstorage", "gstorage"],
        },
    ],
};
