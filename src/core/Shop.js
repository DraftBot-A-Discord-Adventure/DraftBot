class Shop {

    constructor(customer, entity, message, language) {
        this.customer = customer;
        this.entity = entity;
        this.message = message;
        this.language = language;
    }

    /**
     * Open the shop
     * @return {Promise<void>}
     */
    async open() {

        const shopTranslations = JsonReader.commands.shop.getTranslation(this.language);
        const numberOfPotions = await Potions.count();

        //Formatting intems data into a string
        const randomItem = format(shopTranslations.display, {
            name: shopTranslations.permanentItems.randomItem.name,
            price: shopTranslations.permanentItems.randomItem.price
        });
        const healAlterations = format(shopTranslations.display, {
            name: shopTranslations.permanentItems.healAlterations.name,
            price: shopTranslations.permanentItems.healAlterations.price
        });
        const regen = format(shopTranslations.display, {
            name: shopTranslations.permanentItems.regen.name,
            price: shopTranslations.permanentItems.regen.price
        });
        const badge = format(shopTranslations.display, {
            name: shopTranslations.permanentItems.badge.name,
            price: shopTranslations.permanentItems.badge.price
        });
        const guildXp = format(shopTranslations.display, {
            name: shopTranslations.permanentItems.guildXp.name,
            price: shopTranslations.permanentItems.guildXp.price
        });

        //Fetching potion infos
        const potion = await Potions.findOne({
            where: {
                id: Math.round((Date.now() / (1000 * 60 * 60 * 24)) % (numberOfPotions - 1) + 1)
            }
        });
        const potionPrice = Math.round((parseInt(JsonReader.values.raritiesValues[potion.rarity]) + parseInt(potion.power)) * 0.7);

        //Creating shop message
        const message = await this.message.channel.send(
            new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setTitle(shopTranslations.title)
            .addField(shopTranslations.dailyItem, format(shopTranslations.display, {
                name: potion.toPotionString(this.language),
                price: potionPrice
            }))
            .addField(shopTranslations.permanentItem, [randomItem, healAlterations, regen, badge, guildXp].join('\n') + format(shopTranslations.moneyQuantity, {
                money: this.entity.Player.money
            })));

        //Adding reactions
        await message.react(potion.getEmoji());
        await message.react(SHOP.QUESTION);
        await message.react(SHOP.HOSPITAL);
        await message.react(SHOP.HEART);
        await message.react(SHOP.MONEY_MOUTH);
        await message.react(SHOP.STAR);

        //Creating maps to get shop items everywhere
        this.dailyPotion = new Map().set('price', potionPrice).set('potion', potion);
        this.shopItems = new Map()
            .set(SHOP.QUESTION, shopTranslations.permanentItems.randomItem)
            .set(SHOP.HOSPITAL, shopTranslations.permanentItems.healAlterations)
            .set(SHOP.HEART, shopTranslations.permanentItems.regen)
            .set(SHOP.MONEY_MOUTH, shopTranslations.permanentItems.badge)
            .set(SHOP.STAR, shopTranslations.permanentItems.guildXp);

        //Asking for the user interaction
        this.createItemSelector(message);
    }

    /**
     * Collect reactions on a message. Used to get the item the customer wants
     * @param {*} message - The message where the collector will listen
     */
    async createItemSelector(message) {
        const customer = this.customer;
        const shop = this;
        const collector = message.createReactionCollector((reaction, user) => {
            return (user.id == customer.id);
        }, {
            time: 120000
        });

        collector.on('collect', async (reaction) => {
            collector.stop();
            shop.checkForMoney(message, reaction);
        });
    }

    /**
     * Collect reactions on a message. Used to confirm purchase
     * @param {*} message - The message where the collector will listen
     */
    async createConfirmSelector(message) {
        const customer = this.customer;
        const shop = this;
        const collector = message.createReactionCollector((reaction, user) => {
            return (user.id == customer.id);
        }, {
            time: 120000
        });

        collector.on('collect', async (reaction) => {
            collector.stop();
            if (reaction.emoji.name === MENU_REACTION.ACCEPT)
                shop.sellItem(message, reaction);
            else if (reaction.emoji.name === MENU_REACTION.DENY)
                shop.cancelPurchase(message);
        });

        collector.on('end', async (reaction) => {
            if (!reaction.first()) {
                shop.cancelPurchase(message);
            }
        });
    }

    /**
     * @param {*} message - The message where the react event trigerred
     * @param {*} reaction - The reaction
     */
    async sellItem(message, reaction) {
        const shopTranslations = JsonReader.commands.shop.getTranslation(this.language);
        if (this.selectedItem.name) { //This is not a potion
            if (this.selectedItem.name === shopTranslations.permanentItems.randomItem.name) {
                this.giveRandomItem(message);
            } else if (this.selectedItem.name === shopTranslations.permanentItems.healAlterations.name) {
                this.healAlterations(message);
            } else if (this.selectedItem.name === shopTranslations.permanentItems.regen.name) {
                this.regenPlayer(message);
            } else if (this.selectedItem.name === shopTranslations.permanentItems.badge.name) {
                this.giveMoneyMouthBadge(message);
            } else if (this.selectedItem.name === shopTranslations.permanentItems.guildXp.name) {
                await this.giveGuildXp(message);
            }
        } else {
            this.giveDailyPotion(message);
        }
    }

    /**
     * Check if user has enough money to buy
     * @param {*} message - The message where the react event trigerred
     * @param {*} reaction - The reaction
     */
    async checkForMoney(message, reaction) {
        const potion = this.dailyPotion.get('potion');
        const potionPrice = this.dailyPotion.get('price');

        if (this.shopItems.has(reaction.emoji.name)) {

            const item = this.shopItems.get(reaction.emoji.name);
            if (this.canBuy(item.price)) {
                await this.confirmPurchase(item.name, item.price, item.info);
                this.selectedItem = item;
            } else {
                this.cannotBuy(item.price);
            }
        } else if (potion.getEmoji() === reaction.emoji.id || potion.getEmoji() === reaction.emoji.name) {

            if (this.canBuy(potionPrice)) {
                await this.confirmPurchase(potion.toPotionString(this.language), potionPrice, JsonReader.commands.shop.getTranslation(this.language).potion.info);
                this.selectedItem = potion;
            } else {
                this.cannotBuy(potionPrice);
            }
        }
    }

    /**
     * @param {*} name - The item name
     * @param {*} price - The item price
     * @param {*} info - The info to display while trying to buy the item
     */
    async confirmPurchase(name, price, info) {
        let confirmEmbed = new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setAuthor(format(JsonReader.commands.shop.getTranslation(this.language).confirm, {
                pseudo: this.customer.username
            }), this.customer.displayAvatarURL())
            .setDescription("\n\u200b\n" + format(JsonReader.commands.shop.getTranslation(this.language).display, {
                name: name,
                price: price
            }) + info);

        const confirmMessage = await this.message.channel.send(confirmEmbed);
        await confirmMessage.react(MENU_REACTION.ACCEPT);
        await confirmMessage.react(MENU_REACTION.DENY);

        this.createConfirmSelector(confirmMessage);
    }

    /**
     * @param {*} price - The item price
     */
    canBuy(price) {
        return this.entity.Player.money >= parseInt(price);
    }

    /********************************************************** GIVE FUNCTIONS **********************************************************/

    /**
     * Give the daily potion to player
     */
    giveDailyPotion(message) {
        this.entity.Player.Inventory.giveObject(this.dailyPotion.get('potion').id, ITEMTYPE.POTION); //Give potion
        this.entity.Player.removeMoney(parseInt(this.dailyPotion.get('price'))); //Remove money
        this.entity.Player.Inventory.save(); //Save
        this.entity.Player.save(); //Save
        message.delete();
        message.channel.send(new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setAuthor(format(JsonReader.commands.shop.getTranslation(this.language).potion.give, {
                pseudo: this.customer.username
            }), this.customer.displayAvatarURL())
            .setDescription("\n\n" + this.dailyPotion.get('potion').toPotionString(this.language)));
    }

    giveRandomItem(message) {
        //TODO GIVE RANDOM ITEM
    }

    /**
     * Clear all player alterations
     */
    healAlterations(message) {
        this.entity.effect = EFFECT.SMILEY; //Clear alterations
        this.entity.Player.removeMoney(parseInt(this.selectedItem.price)); //Remove money
        this.entity.save(); //Save
        this.entity.Player.save(); //Save
        message.delete();
        message.channel.send(new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setAuthor(format(JsonReader.commands.shop.getTranslation(this.language).success, {
                pseudo: this.customer.username
            }), this.customer.displayAvatarURL())
            .setDescription("\n\n" + this.selectedItem.give));
    }

    /**
     * Completely restore player life
     */
    regenPlayer(message) {
        this.entity.setHealth(this.entity.maxHealth); //Heal Player
        this.entity.Player.removeMoney(parseInt(this.selectedItem.price)); //Remove money
        this.entity.save(); //Save
        this.entity.Player.save(); //Save
        message.delete();
        message.channel.send(new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setAuthor(format(JsonReader.commands.shop.getTranslation(this.language).success, {
                pseudo: this.customer.username
            }), this.customer.displayAvatarURL())
            .setDescription("\n\n" + this.selectedItem.give));
    }

    /**
     * Give "MoneyMouth" badge to the player
     */
    giveMoneyMouthBadge(message) {
        if (this.entity.Player.hasBadge('🤑')) {
            this.alreadyHasItem(message);
            message.delete();
        } else {
            this.entity.Player.addBadge('🤑'); //Give badge
            this.entity.Player.removeMoney(parseInt(this.selectedItem.price)); //Remove money
            this.entity.Player.save(); //Save

            message.delete();
            message.channel.send(new discord.MessageEmbed()
                .setColor(JsonReader.bot.embed.default)
                .setAuthor(format(this.selectedItem.give, {
                    pseudo: this.customer.username
                }), this.customer.displayAvatarURL())
                .setDescription("\n\n" + this.selectedItem.name));
        }
    }

    /**
     * Give guild xp
     */
    async giveGuildXp(message) {
        //TODO test this
        try {
            const guild = await Guilds.getById(this.entity.Player.guild_id);
            const toAdd = randInt(50, 450);
            guild.addExperience(toAdd); //Add xp
            this.entity.Player.removeMoney(parseInt(this.selectedItem.price)); //Remove money
            this.entity.Player.save(); //Save
            guild.save();

            message.delete();
            message.channel.send(new discord.MessageEmbed()
                .setColor(JsonReader.bot.embed.default)
                .setAuthor(format(JsonReader.commands.shop.getTranslation(this.language).success, {
                    pseudo: this.customer.username
                }), this.customer.displayAvatarURL())
                .setDescription("\n\n" + format(this.selectedItem.give, {experience: toAdd})));
        } catch (err) {
            this.notInAGuild(message);
        }
    }

    /********************************************************** ERROR FUNCTIONS **********************************************************/

    /**
     * @param {*} price - The item price
     */
    cannotBuy(price, message) {
        let embed = new discord.MessageEmbed()
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.shop.getTranslation(this.language).error.title, {
                pseudo: this.message.author.username
            }), this.message.author.displayAvatarURL())
            .setDescription(format(JsonReader.commands.shop.getTranslation(this.language).error.cannotBuy, {
                missingMoney: parseInt(price) - this.entity.Player.money
            }));
        this.message.channel.send(embed);
    }

    /**
     * @param {*} message - The message where the react event trigerred
     */
    alreadyHasItem(message) {
        message.delete();
        let embed = new discord.MessageEmbed()
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.shop.getTranslation(this.language).error.title, {
                pseudo: this.message.author.username
            }), this.message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.shop.getTranslation(this.language).error.alreadyHasItem);
        this.message.channel.send(embed);
    }

    /**
     * @param {*} message - The message where the react event trigerred
     */
    notInAGuild(message) {
        message.delete();
        let embed = new discord.MessageEmbed()
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.shop.getTranslation(this.language).error.title, {
                pseudo: this.message.author.username
            }), this.message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guild.getTranslation(this.language).noGuildException);
        this.message.channel.send(embed);
    }

    /**
     * @param {*} message - The message where the reaction has been clicked on
     */
    cancelPurchase(message) {
        message.delete();
        this.message.channel.send(format(JsonReader.commands.shop.getTranslation(this.language).error.canceledPurchase, {
            mention: this.customer.toString()
        }));
    }


}

module.exports = Shop;