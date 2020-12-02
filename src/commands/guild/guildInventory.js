/**
 * Display the inventory of the guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildInventoryCommand = async (language, message, args) => {
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
            JsonReader.commands.guildAdd.getTranslation(language).notInAguild
        );
    }

    let inventoryEmbed = new discord.MessageEmbed();

    inventoryEmbed.setTitle(
        format(
            JsonReader.commands.guildInventory.getTranslation(language)
                .embedTitle,
            {
                guild: guild.name,
            }
        )
    );

    inventoryEmbed.setThumbnail(JsonReader.commands.guild.icon);

    inventoryEmbed.addField(
        "**Nourriture** : ",
        "La nourriture est utile pour nourrir tous vos familiers. Si vous en avez plus, achetez en avec la commande `guildshop`"
    );
    inventoryEmbed.addField(
        format(
            JsonReader.commands.guildInventory.getTranslation(language)
                .foodTitle,
            {
                foodType:
                    language === "fr"
                        ? FOOD.COMMON_FOOD.TRANSLATIONS.fr
                        : FOOD.COMMON_FOOD.TRANSLATIONS.en,
            }
        ),
        format(
            JsonReader.commands.guildInventory.getTranslation(language)
                .foodField,
            {
                guildFood: guild.commonPetFood,
                maxFood: GUILD.MAX_COMMON_PETFOOD,
                emote: FOOD.COMMON_FOOD.EMOTE,
                addLovePoints: FOOD.COMMON_FOOD.EFFECT,
            }
        ),
        true
    );
    inventoryEmbed.addField(
        format(
            JsonReader.commands.guildInventory.getTranslation(language)
                .foodTitle,
            {
                foodType:
                    language === "fr"
                        ? FOOD.RARE_FOOD.TRANSLATIONS.fr
                        : FOOD.RARE_FOOD.TRANSLATIONS.en,
            }
        ),
        format(
            JsonReader.commands.guildInventory.getTranslation(language)
                .foodField,
            {
                guildFood: guild.commonPetFood,
                maxFood: GUILD.MAX_RARE_PETFOOD,
                emote: FOOD.RARE_FOOD.EMOTE,
                addLovePoints: FOOD.RARE_FOOD.EFFECT,
            }
        ),
        true
    );
    inventoryEmbed.addField(
        format(
            JsonReader.commands.guildInventory.getTranslation(language)
                .foodTitle,
            {
                foodType:
                    language === "fr"
                        ? FOOD.UNIQUE_FOOD.TRANSLATIONS.fr
                        : FOOD.UNIQUE_FOOD.TRANSLATIONS.en,
            }
        ),
        format(
            JsonReader.commands.guildInventory.getTranslation(language)
                .foodField,
            {
                guildFood: guild.commonPetFood,
                maxFood: GUILD.MAX_UNIQUE_PETFOOD,
                emote: FOOD.UNIQUE_FOOD.EMOTE,
                addLovePoints: FOOD.UNIQUE_FOOD.EFFECT,
            }
        ),
        true
    );
    await message.channel.send(inventoryEmbed);
};

module.exports = {
    commands: [
        {
            name: "guildinventory",
            func: GuildInventoryCommand,
            aliases: ["guildinventory", "ginv"],
        },
    ],
};
