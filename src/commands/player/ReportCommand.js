const Op = require("sequelize/lib/operators");

/**
 * Allow the user to learn more about what is going on with his character
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @param {Number} forceSpecificEvent - For testing purpose
 */
const ReportCommand = async function (
    language,
    message,
    args,
    forceSpecificEvent = -1
) {
    const [entity] = await Entities.getOrRegister(message.author.id);

    if (
        (await canPerformCommand(
            message,
            language,
            PERMISSION.ROLE.ALL,
            [EFFECT.DEAD],
            entity
        )) !== true
    ) {
        return;
    }
    if (await sendBlockedError(message.author, message.channel, language)) {
        return;
    }

    let time;
    if (forceSpecificEvent === -1) {
        time = millisecondsToMinutes(
            message.createdAt.getTime() - entity.Player.lastReportAt.valueOf()
        );
    } else {
        time = JsonReader.commands.report.timeMaximal + 1;
    }
    if (time > JsonReader.commands.report.timeLimit) {
        time = JsonReader.commands.report.timeLimit;
    }

    if (entity.Player.score === 0 && entity.effect === EFFECT.BABY) {
        const event = await Events.findOne({ where: { id: 0 } });
        return await doEvent(message, language, event, entity, time, 100);
    }

    if (time < JsonReader.commands.report.timeMinimal) {
        if (entity.currentEffectFinished()) {
            return await message.channel.send(
                format(
                    JsonReader.commands.report.getTranslation(language)
                        .noReport,
                    { pseudo: message.author }
                )
            );
        } else {
            return await canPerformCommand(
                message,
                language,
                PERMISSION.ROLE.ALL,
                [entity.effect],
                entity
            );
        }
    }

    if (
        time <= JsonReader.commands.report.timeMaximal &&
        draftbotRandom.integer(0, JsonReader.commands.report.timeMaximal - 1) >
            time
    ) {
        return await doPossibility(
            message,
            language,
            await Possibilities.findAll({ where: { event_id: 9999 } }),
            entity,
            time
        );
    }

    const Sequelize = require("sequelize");
    let event;

    // nextEvent is defined ?
    if (
        entity.Player.nextEvent !== undefined &&
        entity.Player.nextEvent !== null
    ) {
        forceSpecificEvent = entity.Player.nextEvent;
    }

    if (forceSpecificEvent === -1) {
        event = await Events.findOne({
            where: {
                [Op.and]: [{ id: { [Op.gt]: 0 } }, { id: { [Op.lt]: 9999 } }],
            },
            order: Sequelize.literal("RANDOM()"),
        });
    } else {
        event = await Events.findOne({ where: { id: forceSpecificEvent } });
    }
    return await doEvent(message, language, event, entity, time);
};

/**
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Event} event
 * @param {Entities} entity
 * @param {Number} time
 * @param {Number} forcePoints Force a certain number of points to be given instead of random
 * @return {Promise<void>}
 */
const doEvent = async (
    message,
    language,
    event,
    entity,
    time,
    forcePoints = 0
) => {
    log(entity.discordUser_id + " got report with id " + event.id);
    const eventDisplayed = await message.channel.send(
        format(JsonReader.commands.report.getTranslation(language).doEvent, {
            pseudo: message.author,
            event: event[language],
        })
    );
    const reactions = await event.getReactions();
    const collector = eventDisplayed.createReactionCollector(
        (reaction, user) => {
            return (
                reactions.indexOf(reaction.emoji.name) !== -1 &&
                user.id === message.author.id
            );
        },
        { time: 120000 }
    );

    addBlockedPlayer(entity.discordUser_id, "report", collector);

    collector.on("collect", async (reaction) => {
        collector.stop();
        const possibility = await Possibilities.findAll({
            where: { event_id: event.id, possibilityKey: reaction.emoji.name },
        });
        await doPossibility(
            message,
            language,
            possibility,
            entity,
            time,
            forcePoints
        );
    });

    collector.on("end", async (collected) => {
        if (!collected.first()) {
            const possibility = await Possibilities.findAll({
                where: { event_id: event.id, possibilityKey: "end" },
            });
            await doPossibility(
                message,
                language,
                possibility,
                entity,
                time,
                forcePoints
            );
        }
    });
    for (const reaction of reactions) {
        if (reaction !== "end") {
            await eventDisplayed.react(reaction).catch();
        }
    }
};

/**
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {Possibility} possibility
 * @param {Entity} entity
 * @param {Number} time
 * @param {Number} forcePoints Force a certain number of points to be given instead of random
 * @return {Promise<Message>}
 */
const doPossibility = async (
    message,
    language,
    possibility,
    entity,
    time,
    forcePoints = 0
) => {
    [entity] = await Entities.getOrRegister(entity.discordUser_id);
    const player = entity.Player;

    if (possibility.length === 1) {
        //Don't do anything if the player ends the first report
        if (
            possibility[0].dataValues.event_id === 0 &&
            possibility[0].dataValues.possibilityKey === "end"
        ) {
            removeBlockedPlayer(entity.discordUser_id);
            return await message.channel.send(
                format(
                    JsonReader.commands.report.getTranslation(language)
                        .doPossibility,
                    {
                        pseudo: message.author,
                        result: "",
                        event: possibility[0].dataValues[language],
                    }
                )
            );
        }
    }

    possibility = possibility[randInt(0, possibility.length)];
    const pDataValues = possibility.dataValues;
    let scoreChange;
    if (forcePoints !== 0) {
        scoreChange = forcePoints;
    } else {
        scoreChange =
            time + draftbotRandom.integer(0, time / 10 + player.level - 1);
    }
    let moneyChange =
        pDataValues.money +
        Math.round(
            time / 10 +
                draftbotRandom.integer(0, time / 10 + player.level / 5 - 1)
        );
    if (pDataValues.money < 0 && moneyChange > 0) {
        moneyChange = Math.round(pDataValues.money / 2);
    }

    let result = "";
    result += format(
        JsonReader.commands.report.getTranslation(language).points,
        { score: scoreChange }
    );
    if (moneyChange !== 0) {
        result +=
            moneyChange >= 0
                ? format(
                      JsonReader.commands.report.getTranslation(language).money,
                      { money: moneyChange }
                  )
                : format(
                      JsonReader.commands.report.getTranslation(language)
                          .moneyLoose,
                      { money: -moneyChange }
                  );
    }
    if (pDataValues.experience > 0) {
        result += format(
            JsonReader.commands.report.getTranslation(language).experience,
            { experience: pDataValues.experience }
        );
    }

    if (pDataValues.health < 0) {
        result += format(
            JsonReader.commands.report.getTranslation(language).healthLoose,
            { health: -pDataValues.health }
        );
    }
    if (pDataValues.health > 0) {
        result += format(
            JsonReader.commands.report.getTranslation(language).health,
            { health: pDataValues.health }
        );
    }

    if (pDataValues.lostTime > 0 && pDataValues.effect === ":clock2:") {
        result += format(
            JsonReader.commands.report.getTranslation(language).timeLost,
            { timeLost: minutesToString(pDataValues.lostTime) }
        );
    }
    result = format(
        JsonReader.commands.report.getTranslation(language).doPossibility,
        { pseudo: message.author, result: result, event: possibility[language] }
    );

    entity.effect = pDataValues.effect;

    if (pDataValues.oneshot) {
        await entity.addHealth(-entity.health);
    } else {
        await entity.addHealth(pDataValues.health);
    }
    player.addScore(scoreChange);
    player.addWeeklyScore(scoreChange);
    player.addMoney(moneyChange);
    player.experience += possibility.experience;

    if (pDataValues.nextEvent !== undefined) {
        player.nextEvent = pDataValues.nextEvent;
    }

    if (pDataValues.event_id !== 0) {
        player.setLastReportWithEffect(
            message.createdTimestamp,
            pDataValues.lostTime,
            pDataValues.effect
        );
    } else {
        player.setLastReportWithEffect(
            0,
            pDataValues.lostTime,
            pDataValues.effect
        );
    }

    if (pDataValues.item === true) {
        await giveRandomItem(
            (await message.guild.members.fetch(entity.discordUser_id)).user,
            message.channel,
            language,
            entity
        );
    }

    if (pDataValues.eventId === 0) {
        player.money = 0;
        player.score = 0;
        if (pDataValues.emoji !== "end") {
            player.money = 10;
            player.score = 100;
        }
    }

    let resultMsg = await message.channel.send(result);

    removeBlockedPlayer(entity.discordUser_id);

    while (player.needLevelUp()) {
        await player.levelUpIfNeeded(entity, message.channel, language);
    }

    await player.killIfNeeded(entity, message.channel, language);

    entity.save();
    player.save();

    log(entity.discordUser_id + " finished a report; score: " + scoreChange + "; money: " + moneyChange + "; health: " + pDataValues.health + "; experience: " + pDataValues.experience + "; lost time: " + pDataValues.lostTime + "; effect: " + pDataValues.effect);

    return resultMsg;
};

module.exports = {
    commands: [
        {
            name: "report",
            func: ReportCommand,
            aliases: ["r"],
        },
    ],
};
