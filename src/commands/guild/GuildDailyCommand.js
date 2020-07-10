/**
 * Allow to claim a daily guild reward
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildDailyCommand = async (language, message, args) => {
  let entity; let guild;
  const embed = new discord.MessageEmbed();

  [entity] = await Entities.getOrRegister(message.author.id);

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity)) !== true) {
    return;
  }

  // search for a user's guild
  try {
    guild = await Guilds.getById(entity.Player.guild_id);
  } catch (error) {
    guild = null;
  }

  if (guild === null) { // not in a guild
    return sendErrorMessage(
      message.author,
      message.channel,
      language,
      JsonReader.commands.guildDaily.getTranslation(language).notInAGuild);
  }

  let time = millisecondsToHours(message.createdAt.getTime() - guild.lastDailyAt.valueOf());
  if (time < JsonReader.commands.guildDaily.timeBetweenDailys) {
    return sendErrorMessage(
      message.author,
      message.channel,
      language,
      format(JsonReader.commands.guildDaily.getTranslation(language).coolDown, {
        coolDownTime : JsonReader.commands.guildDaily.timeBetweenDailys,
        time: JsonReader.commands.guildDaily.timeBetweenDailys-time,
      }));
  }

  guild.lastDailyAt = new Date(message.createdTimestamp);
  await guild.save();

  const members = await Entities.getByGuild(guild.id);

  for (const i in members) {
    if (await sendBlockedError(await client.users.fetch(members[i].discordUser_id), message.channel, language)) {
      return;
    }
  }

  let rewardType = generateRandomProperty(guild);
  embed.setTitle(format(JsonReader.commands.guildDaily.getTranslation(language).rewardTitle, {
    guildName: guild.name,
  }));

  if (rewardType === REWARD_TYPES.PERSONNAL_XP) {
    const xpWon = randInt(
      JsonReader.commands.guildDaily.minimalXp + guild.level,
      JsonReader.commands.guildDaily.maximalXp + guild.level * 2);
    for (const i in members) {
      members[i].Player.experience += xpWon;
      await members[i].Player.levelUpIfNeeded(members[i], message.channel, language);
      await members[i].Player.save();
    }
    embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).personalXP, {
      xp: xpWon,
    }));
  }

  if (rewardType === REWARD_TYPES.GUILD_XP) {
    const xpGuildWon = randInt(
      JsonReader.commands.guildDaily.minimalXp + guild.level,
      JsonReader.commands.guildDaily.maximalXp + guild.level * 2);
    guild.experience += xpGuildWon;
    await guild.levelUpIfNeeded(message.channel, language);
    await guild.save();
    embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).guildXP, {
      xp: xpGuildWon,
    }));
  }

  if (rewardType === REWARD_TYPES.MONEY) {
    const moneyWon = randInt(
      JsonReader.commands.guildDaily.minimalMoney + guild.level,
      JsonReader.commands.guildDaily.maximalMoney + guild.level * 4);
    for (const i in members) {
      members[i].Player.addMoney(moneyWon);
      await members[i].Player.save();
    }
    embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).money, {
      money: moneyWon,
    }));
  }

  if (rewardType === REWARD_TYPES.FIXED_MONEY) {
    const moneyWon = JsonReader.commands.guildDaily.fixedMoney;
    for (const i in members) {
      members[i].Player.addMoney(moneyWon);
      await members[i].Player.save();
    }
    embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).money, {
      money: moneyWon,
    }));
  }

  if (rewardType === REWARD_TYPES.BADGE) {
    let membersThatOwnTheBadge = 0;
    for (const i in members) {
      if (members[i].Player.badges.includes('💎')) {
        membersThatOwnTheBadge++;
      } else {
        members[i].Player.addBadge('💎');
      }
      await members[i].Player.save();
    }
    if (membersThatOwnTheBadge != members.length) {
      embed.setDescription(JsonReader.commands.guildDaily.getTranslation(language).badge);
    } else {
      // everybody already have the badge, give something else instead
      rewardType = REWARD_TYPES.PARTIAL_HEAL;
    }
  }

  if (rewardType === REWARD_TYPES.FULL_HEAL) {
    for (const i in members) {
      if (members[i].effect != EFFECT.DEAD) {
        members[i].addHealth(members[i].maxHealth);
      }
      await members[i].save();
    }
    embed.setDescription(JsonReader.commands.guildDaily.getTranslation(language).fullHeal);
  }

  if (rewardType === REWARD_TYPES.PARTIAL_HEAL) {
    for (const i in members) {
      if (members[i].effect != EFFECT.DEAD) {
        members[i].addHealth(Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer));
      }
      await members[i].save();
    }
    embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).partialHeal, {
      healthWon: Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer),
    }));
  }

  if (rewardType === REWARD_TYPES.ALTERATION) {
    for (const i in members) {
      if (members[i].effect != EFFECT.SMILEY) { // TODO : test with duration of the effects
        members[i].addHealth(Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer));
      } else if (members[i].effect != EFFECT.DEAD && members[i].effect != EFFECT.LOCKED) {
        members[i].effect = EFFECT.SMILEY;
        members[i].Player.lastReportAt = new Date(message.createdTimestamp);
      }
      await members[i].save();
    }
    embed.setDescription(format(JsonReader.commands.guildDaily.getTranslation(language).alterationHeal, {
      healthWon: Math.round(guild.level / JsonReader.commands.guildDaily.levelMultiplayer),
    }));
  }

  message.channel.send(embed);
  return;
};

module.exports = {
  'guilddaily': GuildDailyCommand,
  'gdaily': GuildDailyCommand,
  'gd': GuildDailyCommand,
};


/**
 * update the moment where the daily guild was used
 * @param {*} guild
 * @param {*} message
 */
function updateLastInvocation(guild, message) {
  guild.lastInvocation = message.createdTimestamp;
}

function generateRandomProperty(guild) {
  let resultNumber = randInt(0, 1000);
  const rewardLevel = Math.floor(guild.level / 10);
  const recompenses = JsonReader.commands.guildDaily.guildChances[rewardLevel];
  for (const property in recompenses) {
    if (recompenses[property] < resultNumber) {
      resultNumber -= recompenses[property];
    } else {
      return property;
    }
  }
}

