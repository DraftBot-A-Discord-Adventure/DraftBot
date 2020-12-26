const { Guild } = require("discord.js");

/**
 * Allow to sell pet
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const PetSellCommand = async function (language, message, args) {
    let [entity] = await Entities.getOrRegister(message.author.id);

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
    if (await sendBlockedError(message.author, message.channel, language)) {
        return;
    }

    const petCost = parseInt(args[1]);

    if (isNaN(petCost))
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.petSell.getTranslation(language).needNumber
        );

    /* if (message.mentions.users.first().id === message.author.id) {
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.petSell.getTranslation(language).cantTradeSelf
        ); 
    } */

    let pet1 = entity.Player.Pet;
    if (!pet1) {
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.myPet.getTranslation(language).noPet
        );
    }

    const confirmEmbed = new discord.MessageEmbed();
    confirmEmbed.setAuthor(
        JsonReader.commands.petSell.getTranslation(language).tradeTitle,
        message.author.displayAvatarURL()
    );
    confirmEmbed.setDescription(
        format(
            JsonReader.commands.petSell.getTranslation(language)
                .tradeDescription,
            {
                trader1: message.author,
                trader2: message.mentions.users.first(),
            }
        )
    );
    confirmEmbed.setFooter(
        JsonReader.commands.petSell.getTranslation(language).warningTradeReset
    );
    confirmEmbed.addField(
        format(
            JsonReader.commands.petSell.getTranslation(language).petOfTrader,
            {
                trader: await entity.Player.getPseudo(language),
            }
        ),
        await PetEntities.getPetDisplay(pet1, language),
        true
    );

    const confirmMessage = await message.channel.send(confirmEmbed);

    let trader1Accepted = null;
    let trader2Accepted = null;

    const filter = (reaction, user) => {
        return (
            (reaction.emoji.name === MENU_REACTION.ACCEPT ||
                reaction.emoji.name === MENU_REACTION.DENY) &&
            (user.id === message.author.id ||
                user.id === message.mentions.users.first().id)
        );
    };

    const collector = confirmMessage.createReactionCollector(filter, {
        time: 120000,
        dispose: true,
    });

    addBlockedPlayer(trader1.discordUser_id, "petSell", collector);
    addBlockedPlayer(trader2.discordUser_id, "petSell", collector);

    collector.on("remove", (reaction, user) => {
        if (reaction.emoji.name === MENU_REACTION.ACCEPT) {
            if (user.id === message.author.id) {
                trader1Accepted = null;
            } else {
                trader2Accepted = null;
            }
        }
    });

    collector.on("collect", (reaction, user) => {
        if (reaction.emoji.name === MENU_REACTION.ACCEPT) {
            if (user.id === message.author.id) {
                trader1Accepted = true;
            } else {
                trader2Accepted = true;
            }
            if (trader1Accepted === true && trader2Accepted === true) {
                collector.stop();
            }
        } else if (reaction.emoji.name === MENU_REACTION.DENY) {
            if (user.id === message.author.id) {
                trader1Accepted = false;
            } else {
                trader2Accepted = false;
            }
            collector.stop();
        }
    });

    collector.on("end", async (reaction) => {
        [trader1] = await Entities.getOrRegister(message.author.id);
        [trader2] = await Entities.getOrRegister(
            message.mentions.users.first().id
        );
        pet1 = trader1.Player.Pet;
        removeBlockedPlayer(trader1.discordUser_id);
        removeBlockedPlayer(trader2.discordUser_id);
        if (trader1Accepted === true && trader2Accepted === true) {
            trader2.Player.pet_id = pet1.id;
            trader2.Player.save();
            pet1.lovePoints = PETS.BASE_LOVE;
            pet1.save();
            const successEmbed = new discord.MessageEmbed();
            successEmbed.setAuthor(
                JsonReader.commands.petSell.getTranslation(language).tradeTitle,
                message.author.displayAvatarURL()
            );
            successEmbed.setDescription(
                JsonReader.commands.petSell.getTranslation(language)
                    .tradeSuccess
            );
            await message.channel.send(successEmbed);
        } else if (trader1Accepted === false || trader2Accepted === false) {
            await sendErrorMessage(
                message.author,
                message.channel,
                language,
                format(
                    JsonReader.commands.petSell.getTranslation(language)
                        .tradeCanceled,
                    {
                        trader:
                            trader1Accepted === false
                                ? message.author
                                : message.mentions.users.first(),
                    }
                )
            );
        } else {
            await sendErrorMessage(
                message.author,
                message.channel,
                language,
                JsonReader.commands.petSell.getTranslation(language)
                    .tradeCanceledTime
            );
        }
    });

    await Promise.all([
        confirmMessage.react(MENU_REACTION.ACCEPT),
        confirmMessage.react(MENU_REACTION.DENY),
    ]);
};

module.exports = {
    commands: [
        {
            name: "petsell",
            func: PetSellCommand,
            aliases: ["psell", "ps"],
        },
    ],
};
