/**
 * Displays the shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function ShopCommand(language, message, args) {
    let [entity] = await Entities.getOrRegister(message.author.id); //Loading player

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity)) !== true) {
        return;
    }
    if (await sendBlockedError(message.author, message.channel, language)) {
        return;
    }

    addBlockedPlayer(entity.discordUser_id, 'shop');

    const shopTranslations = JsonReader.commands.shop.getTranslation(language);
    const numberOfPotions = await Potions.count();

    //Formatting intems data into a string
    const randomItem = format(shopTranslations.display, {
        name: shopTranslations.permanentItems.randomItem.name,
        price: shopTranslations.permanentItems.randomItem.price,
    });
    const healAlterations = format(shopTranslations.display, {
        name: shopTranslations.permanentItems.healAlterations.name,
        price: shopTranslations.permanentItems.healAlterations.price,
    });
    const regen = format(shopTranslations.display, {
        name: shopTranslations.permanentItems.regen.name,
        price: shopTranslations.permanentItems.regen.price,
    });
    const badge = format(shopTranslations.display, {
        name: shopTranslations.permanentItems.badge.name,
        price: shopTranslations.permanentItems.badge.price,
    });
    const guildXp = format(shopTranslations.display, {
        name: shopTranslations.permanentItems.guildXp.name,
        price: shopTranslations.permanentItems.guildXp.price,
    });

    //Fetching potion infos
    const potion = await Potions.findOne({
        where: {
            id: ((Math.round(Date.now() / (1000 * 60 * 60 * 24))) % (numberOfPotions - 1)) + 1,
        },
    });
    const potionPrice = Math.round(
        (parseInt(JsonReader.values.raritiesValues[potion.rarity]) + parseInt(potion.power)) * 0.7
    );

    //Creating shop message
    const shopMessage = await message.channel.send(
        new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setTitle(shopTranslations.title)
            .addField(
                shopTranslations.dailyItem,
                format(shopTranslations.display, {
                    name: potion.toString(language),
                    price: potionPrice,
                }))
            .addField(
                shopTranslations.permanentItem, [randomItem, healAlterations, regen, badge, guildXp].join("\n") +
            format(shopTranslations.moneyQuantity, {
                money: entity.Player.money,
            }))
    );

    //Creating maps to get shop items everywhere
    const dailyPotion = new Map().set("price", potionPrice).set("potion", potion);
    const shopItems = new Map()
        .set(SHOP.QUESTION, shopTranslations.permanentItems.randomItem)
        .set(SHOP.HOSPITAL, shopTranslations.permanentItems.healAlterations)
        .set(SHOP.HEART, shopTranslations.permanentItems.regen)
        .set(SHOP.MONEY_MOUTH, shopTranslations.permanentItems.badge)
        .set(SHOP.STAR, shopTranslations.permanentItems.guildXp);

    const filterConfirm = (reaction, user) => {
        return (user.id === entity.discordUser_id && reaction.me);
    };

    const collector = shopMessage.createReactionCollector(filterConfirm, { time: 120000, max: 1 });

    //Fetch the choice from the user
    collector.on("end", async (reaction) => {
        if (!reaction.first()) { //the user is afk
            removeBlockedPlayer(entity.discordUser_id);
            return;
        }
        if (reaction.first().emoji.name === SHOP.CANCEL) {
            removeBlockedPlayer(entity.discordUser_id);
            sendErrorMessage(message.author, message.channel, language, JsonReader.commands.shop.getTranslation(language).error.leaveShop);
            return;
        }

        const potion = dailyPotion.get("potion");
        const potionPrice = dailyPotion.get("price");
        if (shopItems.has(reaction.first().emoji.name)) {
            const item = shopItems.get(reaction.first().emoji.name);
            if (canBuy(item.price, entity.Player)) {
                await confirmPurchase(shopMessage, language, item.name, item.price, item.info, entity, message.author, item);
            } else {
                sendErrorMessage(message.author, message.channel, language,
                    format(JsonReader.commands.shop.getTranslation(language).error.cannotBuy, {
                        missingMoney: item.price - entity.Player.money,
                    }));
                removeBlockedPlayer(entity.discordUser_id);
            }
        } else if (
            potion.getEmoji() === reaction.first().emoji.id ||
            potion.getEmoji() === reaction.first().emoji.name ||
            SHOP.POTION_REPLACEMENT === reaction.first().emoji.name ||
            SHOP.POTION_REPLACEMENT === reaction.first().id
        ) {
            if (canBuy(potionPrice, entity.Player)) {
                await confirmPurchase(shopMessage, language,
                    potion.toString(language),
                    potionPrice,
                    JsonReader.commands.shop.getTranslation(language).potion.info,
                    entity,
                    message.author,
                    dailyPotion
                );
            } else {
                sendErrorMessage(message.author, message.channel, language, format(
                    JsonReader.commands.shop.getTranslation(language).error.cannotBuy, {
                    missingMoney: potionPrice - entity.Player.money,
                }
                ));
                removeBlockedPlayer(entity.discordUser_id);
            }
        }
    });

    //Adding reactions
    try {
        await shopMessage.react(potion.getEmoji());
    } catch {
        await shopMessage.react(SHOP.POTION_REPLACEMENT);
    }
    await Promise.all([
        shopMessage.react(SHOP.QUESTION),
        shopMessage.react(SHOP.HOSPITAL),
        shopMessage.react(SHOP.HEART),
        shopMessage.react(SHOP.MONEY_MOUTH),
        shopMessage.react(SHOP.STAR),
        shopMessage.react(SHOP.CANCEL)
    ]);
}


/**
 * @param {*} message - The message where the react event trigerred
 * @param {*} reaction - The reaction
 */
async function sellItem(message, reaction, language, entity, customer, selectedItem) {
    [entity] = await Entities.getOrRegister(entity.discordUser_id);
    const shopTranslations = JsonReader.commands.shop.getTranslation(language);
    if (selectedItem.name) {
        //This is not a potion
        if (
            selectedItem.name === shopTranslations.permanentItems.randomItem.name
        ) {
            await giveRandomItem(customer, message.channel, language, entity);
        } else if (
            selectedItem.name === shopTranslations.permanentItems.healAlterations.name
        ) {
            if (entity.currentEffectFinished()) {
                return sendErrorMessage(customer, message.channel, language, JsonReader.commands.shop.getTranslation(language).error.nothingToHeal);
            }
            healAlterations(message, language, entity, customer, selectedItem);
        } else if (
            selectedItem.name === shopTranslations.permanentItems.regen.name
        ) {
            regenPlayer(message, language, entity, customer, selectedItem);
        } else if (
            selectedItem.name === shopTranslations.permanentItems.badge.name
        ) {
            let success = giveMoneyMouthBadge(message, language, entity, customer, selectedItem);
            if (!success) {
                return;
            }
        } else if (
            selectedItem.name === shopTranslations.permanentItems.guildXp.name
        ) {
            if (!await giveGuildXp(message, language, entity, customer, selectedItem))
                return;//if no guild, no need to proceed
        }
        entity.Player.addMoney(-selectedItem.price); //Remove money
    } else {
        giveDailyPotion(message, language, entity, customer, selectedItem);
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
async function confirmPurchase(message, language, name, price, info, entity, customer, selectedItem) {
    const confirmEmbed = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.default)
        .setAuthor(
            format(JsonReader.commands.shop.getTranslation(language).confirm, {
                pseudo: customer.username,
            }),
            customer.displayAvatarURL()
        )
        .setDescription(
            "\n\u200b\n" +
            format(JsonReader.commands.shop.getTranslation(language).display, {
                name: name,
                price: price,
            }) +
            info
        );

    const confirmMessage = await message.channel.send(confirmEmbed);
    const filterConfirm = (reaction, user) => {
        return ((reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) && user.id === entity.discordUser_id);
    };

    const collector = confirmMessage.createReactionCollector(filterConfirm, {
        time: 120000,
        max: 1,
    });

    collector.on("end", async (reaction) => {
        removeBlockedPlayer(entity.discordUser_id);
        //confirmMessage.delete(); for now we'll keep the messages
        if (reaction.first()) {
            if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
                reaction.first().message.delete();
                return sellItem(message, reaction, language, entity, customer, selectedItem);
            }
        }
        sendErrorMessage(customer, message.channel, language, JsonReader.commands.shop.getTranslation(language).error.canceledPurchase);
    });

    await Promise.all([
        confirmMessage.react(MENU_REACTION.ACCEPT),
        confirmMessage.react(MENU_REACTION.DENY),
    ]);
}

/**
 * @param {*} price - The item price
 */
const canBuy = function (price, player) {
    return player.money >= price;
};

/********************************************************** GIVE FUNCTIONS **********************************************************/

/**
 * Give the daily potion to player
 */
function giveDailyPotion(message, language, entity, customer, dailyPotion) {
    entity.Player.Inventory.giveObject(
        dailyPotion.get("potion").id,
        ITEMTYPE.POTION
    ); //Give potion
    entity.Player.addMoney(-dailyPotion.get("price")); //Remove money
    entity.Player.Inventory.save(); //Save
    entity.Player.save(); //Save
    message.channel.send(
        new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setAuthor(
                format(JsonReader.commands.shop.getTranslation(language).potion.give, {
                    pseudo: customer.username,
                }),
                customer.displayAvatarURL()
            )
            .setDescription(
                "\n\n" + dailyPotion.get("potion").toString(language)
            )
    );
}

/**
 * Clear all player alterations
 */
function healAlterations(message, language, entity, customer, selectedItem) {
    if (entity.effect !== EFFECT.DEAD && entity.effect !== EFFECT.LOCKED) {
        entity.effect = EFFECT.SMILEY;
        entity.Player.lastReportAt = new Date(message.createdTimestamp);
    }
    message.channel.send(
        new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setAuthor(
                format(JsonReader.commands.shop.getTranslation(language).success, {
                    pseudo: customer.username,
                }),
                customer.displayAvatarURL()
            )
            .setDescription("\n\n" + selectedItem.give)
    );
}

/**
 * Completely restore player life
 */
function regenPlayer(message, language, entity, customer, selectedItem) {
    entity.setHealth(entity.maxHealth); //Heal Player
    message.channel.send(
        new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setAuthor(
                format(JsonReader.commands.shop.getTranslation(language).success, {
                    pseudo: customer.username,
                }),
                customer.displayAvatarURL()
            )
            .setDescription("\n\n" + selectedItem.give)
    );
}

/**
 * Give "MoneyMouth" badge to the player
 */
function giveMoneyMouthBadge(message, language, entity, customer, selectedItem) {
    if (entity.Player.hasBadge("🤑")) {
        sendErrorMessage(customer, message.channel, language, JsonReader.commands.shop.getTranslation(language).error.alreadyHasItem);
        return false;
    } else {
        entity.Player.addBadge("🤑"); //Give badge
        message.channel.send(
            new discord.MessageEmbed()
                .setColor(JsonReader.bot.embed.default)
                .setAuthor(
                    format(selectedItem.give, {
                        pseudo: customer.username,
                    }),
                    customer.displayAvatarURL()
                )
                .setDescription("\n\n" + selectedItem.name)
        );
        return true;
    }
}

/**
 * Give guild xp
 */
async function giveGuildXp(message, language, entity, customer, selectedItem) {
    try {
        const guild = await Guilds.getById(entity.Player.guild_id);
        const toAdd = randInt(50, 450);
        guild.addExperience(toAdd); //Add xp
        while(guild.needLevelUp()) {
            await guild.levelUpIfNeeded(message.channel, language);
        }
        await guild.save();

        message.channel.send(
            new discord.MessageEmbed()
                .setColor(JsonReader.bot.embed.default)
                .setAuthor(
                    format(JsonReader.commands.shop.getTranslation(language).success, {
                        pseudo: customer.username,
                    }),
                    customer.displayAvatarURL()
                )
                .setDescription(
                    "\n\n" +
                    format(selectedItem.give, {
                        experience: toAdd,
                    })
                )
        );
        return true
    } catch (err) {
        sendErrorMessage(customer, message.channel, language, JsonReader.commands.guild.getTranslation(language).noGuildException);
        return false;
    }
}

module.exports = {
    commands: [
        {
            name: 'shop',
            func: ShopCommand,
            aliases: ['s']
        }
    ]
};
