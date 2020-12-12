/**
 * Displays the guild shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function GuildShopCommand(language, message, args) {
    let [entity] = await Entities.getOrRegister(message.author.id); //Loading player

    if (
        (await canPerformCommand(
            message,
            language,
            PERMISSION.ROLE.ALL,
            [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
            entity
        )) !== true
    ) {
        return;
    }
    if (await sendBlockedError(message.author, message.channel, language)) {
        return;
    }

    // search for a user's guild
    try {
        guild = await Guilds.getById(entity.Player.guild_id);
    } catch (error) {
        guild = null;
    }

    if (guild === null) {
        // not in a guild
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.guildDaily.getTranslation(language).notInAGuild
        );
    }

    const shopTranslations = JsonReader.commands.guildShop.getTranslation(
        language
    );

    //Formatting items data into a string
    const commonFood = format(shopTranslations.display, {
        emote: JsonReader.food.getTranslation(language).foodItems.commonFood
            .emote,
        name: JsonReader.food.getTranslation(language).foodItems.commonFood
            .name,
        price: JsonReader.food.getTranslation(language).foodItems.commonFood
            .price,
    });
    const rareFood = format(shopTranslations.display, {
        emote: JsonReader.food.getTranslation(language).foodItems.rareFood
            .emote,
        name: JsonReader.food.getTranslation(language).foodItems.rareFood.name,
        price: JsonReader.food.getTranslation(language).foodItems.rareFood
            .price,
    });
    const uniqueFood = format(shopTranslations.display, {
        emote: JsonReader.food.getTranslation(language).foodItems.uniqueFood
            .emote,
        name: JsonReader.food.getTranslation(language).foodItems.uniqueFood
            .name,
        price: JsonReader.food.getTranslation(language).foodItems.uniqueFood
            .price,
    });
    const growFood = format(shopTranslations.display, {
        emote: JsonReader.food.getTranslation(language).foodItems.growFood
            .emote,
        name: JsonReader.food.getTranslation(language).foodItems.growFood.name,
        price: JsonReader.food.getTranslation(language).foodItems.growFood
            .price,
    });

    const guildXp = format(shopTranslations.display, {
        name: shopTranslations.guildXp.name,
        price: shopTranslations.guildXp.price,
    });

    //Creating shop message
    const shopMessage = await message.channel.send(
        new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setTitle(shopTranslations.title)
            .addField(shopTranslations.xpItem, [guildXp])
            .addField(
                shopTranslations.foodItem,
                [commonFood, rareFood, uniqueFood, growFood].join("\n") +
                    format(shopTranslations.moneyQuantity, {
                        money: entity.Player.money,
                    })
            )
    );

    //Creating maps to get shop items everywhere

    const shopItems = new Map()
        .set(GUILDSHOP.STAR, shopTranslations.guildXp)
        .set(
            GUILDSHOP.COMMON_FOOD,
            JsonReader.food.getTranslation(language).foodItems.commonFood
        )
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
        )
        .set(
            GUILDSHOP.GROW_FOOD,
            JsonReader.food.getTranslation(language).foodItems.growFood
        );

    const filterConfirm = (reaction, user) => {
        return user.id === entity.discordUser_id && reaction.me;
    };

    const collector = shopMessage.createReactionCollector(filterConfirm, {
        time: 120000,
        max: 1,
    });

    addBlockedPlayer(entity.discordUser_id, "guildShop");

    //Fetch the choice from the user
    collector.on("end", async (reaction) => {
        if (!reaction.first()) {
            removeBlockedPlayer(entity.discordUser_id);
            return sendErrorMessage(
                message.author,
                message.channel,
                language,
                JsonReader.commands.shop.getTranslation(language).error
                    .leaveShop
            );
        }
        if (reaction.first().emoji.name === MENU_REACTION.DENY) {
            removeBlockedPlayer(entity.discordUser_id);
            return sendErrorMessage(
                message.author,
                message.channel,
                language,
                JsonReader.commands.shop.getTranslation(language).error
                    .leaveShop
            );
        }

        if (shopItems.has(reaction.first().emoji.name)) {
            const item = shopItems.get(reaction.first().emoji.name);
            if (item.type === "guildXp") {
                if (canBuy(item.price, entity.Player)) {
                    await confirmPurchase(
                        shopMessage,
                        language,
                        item.name,
                        item.price,
                        item.info,
                        entity,
                        message.author,
                        item
                    );
                } else {
                    removeBlockedPlayer(entity.discordUser_id);
                    return sendErrorMessage(
                        message.author,
                        message.channel,
                        language,
                        format(
                            JsonReader.commands.shop.getTranslation(language)
                                .error.cannotBuy,
                            {
                                missingMoney: item.price - entity.Player.money,
                            }
                        )
                    );
                }
            } else {
                /* await confirmPurchase(
                    shopMessage,
                    language,
                    item.name,
                    item.price,
                    item.info,
                    entity,
                    message.author,
                    item
                );
                */
                selectQuantity(
                    shopMessage,
                    language,
                    entity,
                    message.author,
                    item
                );
            }
        }
    });

    //Adding reactions

    await Promise.all([
        shopMessage.react(GUILDSHOP.STAR),
        shopMessage.react(GUILDSHOP.COMMON_FOOD),
        shopMessage.react(GUILDSHOP.RARE_FOOD),
        shopMessage.react(GUILDSHOP.UNIQUE_FOOD),
        shopMessage.react(GUILDSHOP.GROW_FOOD),
        shopMessage.react(MENU_REACTION.DENY),
    ]);
}

/**
 * Displays the guild shop
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param name - name of item
 * @param price - price of item
 * @param info - infos of item
 * @param entity - author of message (for bot)
 * @param author - author of message
 * @param selectedItem - selectionned item
 */

async function confirmPurchase(
    message,
    language,
    entity,
    author,
    selectedItem,
    quantity
) {
    const confirmEmbed = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.default)
        .setAuthor(
            format(JsonReader.commands.shop.getTranslation(language).confirm, {
                pseudo: author.username,
            }),
            author.displayAvatarURL()
        )
        .setDescription(
            "\n\u200b\n" +
                format(
                    JsonReader.commands.guildShop.getTranslation(language)
                        .confirmEmbedField,
                    {
                        emote: selectedItem.emote,
                        quantity: quantity,
                        name: selectedItem.name,
                        price: selectedItem.price * quantity,
                    }
                )
        );

    const confirmMessage = await message.channel.send(confirmEmbed);
    const filterConfirm = (reaction, user) => {
        return (
            (reaction.emoji.name === MENU_REACTION.ACCEPT ||
                reaction.emoji.name === MENU_REACTION.DENY) &&
            user.id === entity.discordUser_id
        );
    };

    const collector = confirmMessage.createReactionCollector(filterConfirm, {
        time: 120000,
        max: 1,
    });

    collector.on("end", async (reaction) => {
        removeBlockedPlayer(entity.discordUser_id);
        if (reaction.first()) {
            if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
                reaction.first().message.delete();
                return sellItem(
                    message,
                    language,
                    entity,
                    author,
                    selectedItem,
                    quantity
                );
            }
        }
        sendErrorMessage(
            author,
            message.channel,
            language,
            JsonReader.commands.shop.getTranslation(language).error
                .canceledPurchase
        );
    });

    await Promise.all([
        confirmMessage.react(MENU_REACTION.ACCEPT),
        confirmMessage.react(MENU_REACTION.DENY),
    ]);
}
/**
 * @param {*} message - The message where the react event trigerred
 */
async function sellItem(
    message,
    language,
    entity,
    author,
    selectedItem,
    quantity
) {
    [entity] = await Entities.getOrRegister(entity.discordUser_id);
    const shopTranslations = JsonReader.commands.guildShop.getTranslation(
        language
    );
    if (selectedItem.name) {
        if (selectedItem.name === shopTranslations.guildXp.name) {
            giveGuildXp(message, language, entity, author, selectedItem);
            entity.Player.addMoney(-selectedItem.price); //Remove money
        } else {
            // selectQuantity(message, language, entity, author, selectedItem);
            await giveFood(
                message,
                language,
                entity,
                author,
                selectedItem,
                quantity
            );
        }
    }

    await Promise.all([
        entity.save(),
        entity.Player.save(),
        entity.Player.Inventory.save(),
    ]);
}

/**
 * @param {*} name - The item name
 * @param {*} price - The item price
 * @param {*} info - The info to display while trying to buy the item
 */

const canBuy = function (price, player) {
    return player.money >= price;
};

// Give guild xp

async function giveGuildXp(message, language, entity, author, selectedItem) {
    const guild = await Guilds.getById(entity.Player.guild_id);
    const toAdd = randInt(50, 450);
    guild.addExperience(toAdd); //Add xp
    while (guild.needLevelUp()) {
        await guild.levelUpIfNeeded(message.channel, language);
    }
    await guild.save();

    return message.channel.send(
        new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setAuthor(
                format(
                    JsonReader.commands.shop.getTranslation(language).success,
                    {
                        pseudo: author.username,
                    }
                ),
                author.displayAvatarURL()
            )
            .setDescription(
                "\n\n" +
                    format(selectedItem.give, {
                        experience: toAdd,
                    })
            )
    );
}

async function selectQuantity(message, language, entity, author, selectedItem) {
    const quantityPosibilities = new Map()
        .set(QUANTITY.ONE, 1)
        .set(QUANTITY.FIVE, 5)
        .set(QUANTITY.TEN, 10);

    const selectQuantityEmbed = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.default)
        .setTitle(
            JsonReader.commands.guildShop.getTranslation(language).quantityTitle
        );

    const selectQuantityMsg = await message.channel.send(selectQuantityEmbed);

    const filterConfirm = (reaction, user) => {
        return user.id === entity.discordUser_id && reaction.me;
    };

    const collector = selectQuantityMsg.createReactionCollector(filterConfirm, {
        time: 120000,
        max: 1,
    });

    addBlockedPlayer(entity.discordUser_id, "selectQuantity");

    collector.on("end", async (reaction) => {
        removeBlockedPlayer(entity.discordUser_id);
        if (!reaction.first()) {
            return sendErrorMessage(
                author,
                message.channel,
                language,
                JsonReader.commands.shop.getTranslation(language).error
                    .canceledPurchase
            );
        }
        if (reaction.first()) {
            if (reaction.first().emoji.name === MENU_REACTION.DENY) {
                return sendErrorMessage(
                    author,
                    message.channel,
                    language,
                    JsonReader.commands.shop.getTranslation(language).error
                        .canceledPurchase
                );
            }
            const quantity = quantityPosibilities.get(
                reaction.first().emoji.name
            );
            if (selectedItem.price * quantity > entity.Player.money) {
                return sendErrorMessage(
                    message.author,
                    message.channel,
                    language,
                    format(
                        JsonReader.commands.shop.getTranslation(language).error
                            .cannotBuy,
                        {
                            missingMoney:
                                selectedItem.price * quantity -
                                entity.Player.money,
                        }
                    )
                );
            } else {
                /*await giveFood(
                    message,
                    language,
                    entity,
                    author,
                    selectedItem,
                    quantity
                );
                */
                await confirmPurchase(
                    message,
                    language,
                    entity,
                    message.author,
                    selectedItem,
                    quantity
                );
                reaction.first().message.delete();
            }
        }
    });

    await Promise.all([
        selectQuantityMsg.react(QUANTITY.ONE),
        selectQuantityMsg.react(QUANTITY.FIVE),
        selectQuantityMsg.react(QUANTITY.TEN),
        selectQuantityMsg.react(MENU_REACTION.DENY),
    ]);
}

const giveFood = async (
    message,
    language,
    entity,
    author,
    selectedItem,
    quantity
) => {
    const guild = await Guilds.getById(entity.Player.guild_id);
    if (
        guild[selectedItem.type] + quantity >
        JsonReader.commands.guildShop.max[selectedItem.type]
    ) {
        const fullStockEmbed = new discord.MessageEmbed().setAuthor(
            JsonReader.commands.guildShop.getTranslation(language).fullStock,
            author.displayAvatarURL()
        );
        return message.channel.send(fullStockEmbed);
    } else {
        guild[selectedItem.type] = guild[selectedItem.type] + quantity;
        await entity.Player.addMoney(-selectedItem.price); //Remove money
        Promise.all([guild.save(), entity.Player.save()]);
        const successEmbed = new discord.MessageEmbed();
        quantity == 1
            ? successEmbed.setAuthor(
                  format(
                      JsonReader.commands.guildShop.getTranslation(language)
                          .singleSuccessAddFoodTitle,
                      {
                          quantity: quantity,
                      }
                  ),

                  author.displayAvatarURL()
              )
            : successEmbed.setAuthor(
                  format(
                      JsonReader.commands.guildShop.getTranslation(language)
                          .multipleSuccessAddFoodTitle,
                      {
                          quantity: quantity,
                      }
                  ),

                  author.displayAvatarURL()
              );

        return message.channel.send(successEmbed);
    }
};

module.exports = {
    commands: [
        {
            name: "guildshop",
            func: GuildShopCommand,
            aliases: ["guildshop", "gs"],
        },
    ],
};
