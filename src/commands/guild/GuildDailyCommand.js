/**
 * Allow to claim a daily guild reward
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildDailyCommand = async (language, message, args) => {


    let entity, guild;
    let embed = new discord.MessageEmbed();

    [entity] = await Entities.getOrRegister(message.author.id);

    // search for a user's guild
    try {
        guild = await Guilds.getById(entity.Player.guild_id);
    } catch (error) {
        guild = null;
    }

    if (guild == null) { // not in a guild
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.guildDaily.getTranslation(language).notInAGuild);
    }

    // if (message.createdTimestamp - guild.lastInvocation < 79200000) {
    //     message.channel.send(generateTooQuickException(message.author, 79200000 - message.createdTimestamp + guild.lastInvocation));
    //     return;
    // }
    // updateLastInvocation(guild, message);

    let members = await Entities.getByGuild(guild.id);
    let rewardType = generateRandomProperty(guild);


    //DEBUG REMOVE BEFORE RELEASE
    rewardType = REWARD_TYPES.PERSONNAL_XP
    //################################

    await entity.Player.Inventory.giveRandomItem();

    await Promise.all([
        entity.save(),
        entity.Player.save(),
        entity.Player.Inventory.save()
    ]);


    embed.setTitle(format(JsonReader.commands.guildDaily.getTranslation(language).rewardTitle, {
        guildName: guild.name
    }));

    if (rewardType === REWARD_TYPES.PERSONNAL_XP) {
        let xpGuildWon = randInt(
            JsonReader.commands.guildDaily.minimalXp + guild.level,
            JsonReader.commands.guildDaily.maximalXp + guild.level * 2);
        //TODO : give xp to players
        embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).personalXP, {
            xp: xpGuildWon
        }));
    }

    if (rewardType === REWARD_TYPES.GUILD_XP) {
        let xpGuildWon = randInt(
            JsonReader.commands.guildDaily.minimalXp + guild.level,
            JsonReader.commands.guildDaily.maximalXp + guild.level * 2);
        //TODO : give guildxp
        embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).guildXP, {
            xp: xpGuildWon
        }));
    }

    if (rewardType === REWARD_TYPES.MONEY) {
        let moneyWon = randInt(
            JsonReader.commands.guildDaily.minimalMoney + guild.level,
            JsonReader.commands.guildDaily.maximalMoney + guild.level * 4);
        //TODO : give money
        embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).money, {
            money: moneyWon
        }));
    }

    if (rewardType === REWARD_TYPES.RANDOM_ITEM) {
        //TODO
        embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).randomItem, {
            money: moneyWon
        }));
    }

    if (rewardType === REWARD_TYPES.BADGE) {
        let membersThatOwnTheBadge = 0;
        for (let i in members) {
            if (members[i].Player.badges.includes("💎")) {
                membersThatOwnTheBadge++;
            } else {
                members[i].Player.addBadge("💎");
            }
            await members[i].Player.save();
        }
        if (membersThatOwnTheBadge != members.length) {
            embed.setDescription(JsonReader.commands.guildDaily.getTranslation(language).badge);
        } else {
            //everybody already have the badge, give something else instead
            rewardType = REWARD_TYPES.PARTIAL_HEAL;
        }
    }

    if (rewardType === REWARD_TYPES.FULL_HEAL) {
        for (let i in members) {
            if (members[i].effect != EFFECT.DEAD) {
                members[i].addHealth(members[i].maxHealth);
            }
            await members[i].save();
        }
        embed.setDescription(JsonReader.commands.guildDaily.getTranslation(language).fullHeal);
    }

    if (rewardType === REWARD_TYPES.PARTIAL_HEAL) {
        for (let i in members) {
            if (members[i].effect != EFFECT.DEAD) {
                members[i].addHealth(Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer));
            }
            await members[i].save();
        }
        embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).partialHeal, {
            healthWon: Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer)
        }));
    }

    if (rewardType === REWARD_TYPES.ALTERATION) {
        for (let i in members) {
            if (members[i].effect != EFFECT.SMILEY) {
                members[i].addHealth(Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer));
            }
            if (members[i].effect != EFFECT.DEAD && members[i].effect != EFFECT.LOCKED) {
                members[i].effect = EFFECT.SMILEY;
                //TODO: unblock user 
            }
            await members[i].save();
        }
        embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).alterationHeal, {
            healthWon: Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer)
        }));
    }

    message.channel.send(embed);
    return;
};

module.exports = {
    "guilddaily": GuildDailyCommand,
    "gdaily": GuildDailyCommand,
    "gd": GuildDailyCommand
};


/**
 * update the moment where the daily guild was used
 * @param {*} guild
 * @param {*} message
 */
function updateLastInvocation(guild, message) {
    guild.lastInvocation = message.createdTimestamp;
}

/**
 * completely heal all guild members
 * @param {*} members - the array of members that will be healed
 */
function completelyHealGuildMembers(members, message) {
    for (let i in members) {
        members[i].restoreHealthCompletely();
        playerManager.updatePlayer(members[i]);
    }
}

/**
 * partially heal all guild members
 * @param {*} members - the array of members that will be healed
 */
function partiallyHealGuildMembers(members, message) {
    let healthAdded = new Array(members.length);
    for (let i = 0; i < members.length; ++i) {
        var healthToAdd = Tools.generateRandomNumber(1, 15);
        healthAdded[i] = healthToAdd;
        members[i].addHealthPoints(healthToAdd, message, language);
        playerManager.updatePlayer(members[i]);
    }
    return healthAdded;
}

/**
 * clear player alterations
 * @param {*} members - the array of members that will get healed
 */
function healStateOfGuildMembers(members, message) {
    var allowedStates = ":dizzy_face::zany_face::nauseated_face::sleeping::head_bandage::cold_face::confounded::clock2:";
    for (let i in members) {
        if (allowedStates.includes(members[i].getEffect())) {
            if (!playerManager.displayTimeLeftProfile(members[i], message, language).includes(":hospital:")) { //the player is not cured
                members[i].updateLastReport(message.createdTimestamp, 0, ":smiley:");
                members[i].effect = ":smiley:";
                playerManager.updatePlayer(members[i]);
            }
        }
    }
}


/**
 * give a random amount of money to all member of a guild
 * @param {*} members - the array of members that will recieve the xp
 * @param {*} message
 */
async function giveRandomItemGuildMembers(members, message) {
    for (let i in members) {
        members[i] = await playerManager.giveRandomItem(message, members[i], true);
        playerManager.updatePlayer(members[i]);
    }
}



function generateRandomProperty(guild) {
    let resultNumber = randInt(0, 1000);
    let rewardLevel = Math.floor(guild.level / 10);
    let recompenses = JsonReader.commands.guildDaily.guildChances[rewardLevel];
    for (const property in recompenses) {
        if (recompenses[property] < resultNumber) {
            resultNumber -= recompenses[property];
        }
        else {
            return property;
        }
    }
}

