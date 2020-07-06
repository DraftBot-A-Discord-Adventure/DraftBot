/**
 * Displays the shop
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function ShopCommand(language, message, args) {
    let [entity] = await Entities.getOrRegister(message.author.id); //Loading player

    //TODO Block user if effect alteration
    //TODO Faire plus de tests

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
            id: Math.round(
                ((Date.now() / (1000 * 60 * 60 * 24)) % (numberOfPotions - 1)) + 1
            ),
        },
    });
    const potionPrice = Math.round(
        (parseInt(JsonReader.values.raritiesValues[potion.rarity]) +
            parseInt(potion.power)) *
        0.7
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
                })
            )
            .addField(
                shopTranslations.permanentItem,
                [randomItem, healAlterations, regen, badge, guildXp].join("\n") +
                format(shopTranslations.moneyQuantity, {
                    money: entity.Player.money,
                })
            )
    );

    //Creating maps to get shop items everywhere
    const dailyPotion = new Map().set("price", potionPrice).set("potion", potion);
    const shopItems = new Map()
        .set(SHOP.QUESTION, shopTranslations.permanentItems.randomItem)
        .set(SHOP.HOSPITAL, shopTranslations.permanentItems.healAlterations)
        .set(SHOP.HEART, shopTranslations.permanentItems.regen)
        .set(SHOP.MONEY_MOUTH, shopTranslations.permanentItems.badge)
        .set(SHOP.STAR, shopTranslations.permanentItems.guildXp);

    //Asking for the user interaction
    createItemSelector(shopMessage, language, entity, dailyPotion, shopItems);

    //Adding reactions
    await Promise.all([
        shopMessage.react(potion.getEmoji()),
        shopMessage.react(SHOP.QUESTION),
        shopMessage.react(SHOP.HOSPITAL),
        shopMessage.react(SHOP.HEART),
        shopMessage.react(SHOP.MONEY_MOUTH),
        shopMessage.react(SHOP.STAR),
    ]);
}

/**
 * Collect reactions on a message. Used to get the item the customer wants
 * @param {*} message - The message where the collector will listen
 */
async function createItemSelector(message, language, entity, dailyPotion, shopItems) {
    const collector = message.createReactionCollector(
        (reaction, user) => {
            return user.id == entity.discordUser_id;
        }, {
        time: 120000,
    }
    );
    collector.on("collect", async (reaction, user) => {
        collector.stop();
        await checkForMoney(message, language, reaction, entity, user, dailyPotion, shopItems);
    });
}

/**
 * Collect reactions on a message. Used to confirm purchase
 * @param {*} message - The message where the collector will listen
 */
async function createConfirmSelector(message, language, entity, customer, selectedItem) {
    const filterConfirm = (reaction, user) => {
        return ((reaction.emoji.name === MENU_REACTION.ACCEPT || reaction.emoji.name === MENU_REACTION.DENY) && user.id === entity.discordUser_id);
    };

    const collector = message.createReactionCollector(filterConfirm, {
        time: 120000,
        max: 1,
    });

    collector.on("end", async (reaction) => {
        message.delete();
        if (!reaction.first()) {
            if (reaction.emoji.name === MENU_REACTION.ACCEPT) {
                return sellItem(message, reaction, language, entity, customer, selectedItem);
            }
        }
        sendErrorMessage(message.author, message.channel, language, JsonReader.commands.shop.getTranslation(language).error.canceledPurchase);
    });
}

/**
 * @param {*} message - The message where the react event trigerred
 * @param {*} reaction - The reaction
 */
async function sellItem(message, reaction, language, entity, customer, selectedItem) {
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
            healAlterations(message, language, entity, customer, selectedItem);
        } else if (
            selectedItem.name === shopTranslations.permanentItems.regen.name
        ) {
            regenPlayer(message, language, entity, customer, selectedItem);
        } else if (
            selectedItem.name === shopTranslations.permanentItems.badge.name
        ) {
            giveMoneyMouthBadge(message, language, entity, customer, selectedItem);
        } else if (
            selectedItem.name === shopTranslations.permanentItems.guildXp.name
        ) {
            await giveGuildXp(message, language, entity, customer, selectedItem);
        }
    } else {
        giveDailyPotion(message, language, entity, customer, selectedItem);
    }
    entity.Player.addMoney(-selectedItem.price); //Remove money
    await Promise.all([
        entity.save(),
        entity.Player.save(),
        entity.Player.Inventory.save(),
    ]);
}

/**
 * Check if user has enough money to buy
 * @param {*} message - The message where the react event trigerred
 * @param {*} reaction - The reaction
 */
async function checkForMoney(message, language, reaction, entity, customer, dailyPotion, shopItems) {
    const potion = dailyPotion.get("potion");
    const potionPrice = dailyPotion.get("price");

    if (shopItems.has(reaction.emoji.name)) {
        const item = shopItems.get(reaction.emoji.name);
        if (canBuy(item.price, entity.Player)) {
            await confirmPurchase(message, language, item.name, item.price, item.info, entity, customer, item);
        } else {
            sendErrorMessage(message.author, message.channel, language, format(
                JsonReader.commands.shop.getTranslation(language).error.cannotBuy, {
                missingMoney: item.price - entity.Player.money,
            }
            ));
        }
    } else if (
        potion.getEmoji() === reaction.emoji.id ||
        potion.getEmoji() === reaction.emoji.name
    ) {
        if (canBuy(potionPrice, entity.Player)) {
            await confirmPurchase(message, language,
                potion.toString(language),
                potionPrice,
                JsonReader.commands.shop.getTranslation(language).potion.info,
                entity,
                customer,
                dailyPotion
            );
        } else {
            sendErrorMessage(message.author, message.channel, language, format(
                JsonReader.commands.shop.getTranslation(language).error.cannotBuy, {
                missingMoney: potionPrice - entity.Player.money,
            }
            ));
        }
    }
}

/**
 * @param {*} name - The item name
 * @param {*} price - The item price
 * @param {*} info - The info to display while trying to buy the item
 */
async function confirmPurchase(message, language, name, price, info, entity, customer, selectedItem) {
    let confirmEmbed = new discord.MessageEmbed()
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
    createConfirmSelector(confirmMessage, language, entity, customer, selectedItem);

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
    message.delete();
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
    entity.effect = EFFECT.SMILEY; //Clear alterations
    message.delete();
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
    message.delete();
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
        sendErrorMessage(message.author, message.channel, language, JsonReader.commands.shop.getTranslation(language).error.alreadyHasItem);
        message.delete();
    } else {
        entity.Player.addBadge("🤑"); //Give badge
        message.delete();
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
    }
}

/**
 * Give guild xp
 */
async function giveGuildXp(message, language, entity, customer, selectedItem) {
    //TODO test this
    try {
        const guild = await Guilds.getById(entity.Player.guild_id);
        const toAdd = randInt(50, 450);
        guild.addExperience(toAdd); //Add xp
        await guild.save();
        message.delete();
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
    } catch (err) {
        message.delete();
        sendErrorMessage(message.author, message.channel, language, JsonReader.commands.guild.getTranslation(language).noGuildException);
    }
}

module.exports = {
    shop: ShopCommand,
    s: ShopCommand,
};
