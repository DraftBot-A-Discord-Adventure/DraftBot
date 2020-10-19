/**
 * Select a class
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function ClassCommand(language, message, args) {
    let [entity] = await Entities.getOrRegister(message.author.id); //Loading player

    if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED], entity, CLASS.REQUIRED_LEVEL)) !== true) {
        return;
    }
    if (await sendBlockedError(message.author, message.channel, language)) {
        return;
    }

    addBlockedPlayer(entity.discordUser_id, 'class');

    const classTranslations = JsonReader.commands.class.getTranslation(language);

    let classesLineDisplay = new Array();
    let allClasses = await Classes.findAll();
    for (let k = 0; k < allClasses.length; k++) {
        classesLineDisplay.push(allClasses[k].toString(language, entity.Player.level))
    }

    //Creating class message
    const classMessage = await message.channel.send(
        new discord.MessageEmbed()
            .setColor(JsonReader.bot.embed.default)
            .setTitle(classTranslations.title)
            .addField(
                classTranslations.desc, classesLineDisplay.join("\n") +
            format(classTranslations.moneyQuantity, {
                money: entity.Player.money,
            }))
    );

    const filterConfirm = (reaction, user) => {
        return (user.id === entity.discordUser_id && reaction.me);
    };

    const collector = classMessage.createReactionCollector(filterConfirm, { time: 120000, max: 1 });

    //Adding reactions
    let classEmojis = new Map();
    for (let k = 0; k < allClasses.length; k++) {
        await classMessage.react(allClasses[k].emoji);
        classEmojis.set(allClasses[k].emoji, k);
    }
    classMessage.react(MENU_REACTION.DENY)

    //Fetch the choice from the user
    collector.on("end", async (reaction) => {
        if (!reaction.first()) { //the user is afk
            removeBlockedPlayer(entity.discordUser_id);
            return;
        }
        if (reaction.first().emoji.name === MENU_REACTION.DENY) {
            removeBlockedPlayer(entity.discordUser_id);
            sendErrorMessage(message.author, message.channel, language, JsonReader.commands.class.getTranslation(language).error.leaveClass);
            return;
        }

        if (canBuy(CLASS.PRICE, entity.Player)) {
            let classid = classEmojis.get(reaction.first().emoji.name);
            confirmPurchase(message, language, classid, entity);
        } else {
            sendErrorMessage(message.author, message.channel, language, format(
                JsonReader.commands.class.getTranslation(language).error.cannotBuy,
                {
                    missingMoney: CLASS.PRICE - entity.Player.money,
                }
            ));
        }
    });
}

/**
 * @param {*} name - The item name
 * @param {*} price - The item price
 * @param {*} info - The info to display while trying to buy the item
 */
async function confirmPurchase(message, language, classId, entity) {

    const selectedClass = await Classes.getById(classId);
    const confirmEmbed = new discord.MessageEmbed()
        .setColor(JsonReader.bot.embed.default)
        .setAuthor(
            format(JsonReader.commands.class.getTranslation(language).confirm, {
                pseudo: message.author.username,
            }),
            message.author.displayAvatarURL()
        )
        .setDescription(
            "\n\u200b\n" +
            format(JsonReader.commands.class.getTranslation(language).display, {
                name: selectedClass.toString(language, entity.Player.level),
                price: CLASS.PRICE,
                description: selectedClass.getDescription(language)
            })
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
        const playerClass = await Classes.getById(entity.Player.class);
        removeBlockedPlayer(entity.discordUser_id);
        if (reaction.first()) {
            if (reaction.first().emoji.name === MENU_REACTION.ACCEPT) {
                if (selectedClass.id === playerClass.id) {
                    return sendErrorMessage(message.author, message.channel, language, JsonReader.commands.class.getTranslation(language).error.sameClass);
                }
                reaction.first().message.delete();
                entity.Player.class = classId;
                entity.Player.addMoney(-CLASS.PRICE);
                await Promise.all([
                    entity.save(),
                    entity.Player.save()
                ]);
                return message.channel.send(
                    new discord.MessageEmbed()
                        .setColor(JsonReader.bot.embed.default)
                        .setAuthor(
                            format(JsonReader.commands.class.getTranslation(language).success, {
                                pseudo: message.author.username,
                            }),
                            message.author.displayAvatarURL()
                        )
                        .setDescription(JsonReader.commands.class.getTranslation(language).newClass + selectedClass.fr)
                );
            }
        }
        sendErrorMessage(message.author, message.channel, language, JsonReader.commands.class.getTranslation(language).error.canceledPurchase);
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


module.exports = {
    commands: [
        {
            name: 'class',
            func: ClassCommand,
            aliases: ['c', 'classes', 'classe']
        }
    ]
};