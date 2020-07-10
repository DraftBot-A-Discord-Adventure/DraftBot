/**
 * Allow to display the info of a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildCommand = async (language, message, args) => {
  let entity; let guild;

  [entity] = await Entities.getByArgs(args, message);
  if (entity === null) {
    [entity] = await Entities.getOrRegister(message.author.id);
  }

  if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], entity)) !== true) {
    return;
  }

  if (args.length > 0 && message.mentions.users.last() === undefined) {
    // args is the name of a guild
    try {
      guild = await Guilds.getByName(args.join(' '));
    } catch (error) {
      guild = null;
    }
  } else {
    if (message.mentions.users.last() !== undefined) {
      [entity] = await Entities.getOrRegister(message.mentions.users.last().id);
    }
    // search for a user's guild
    try {
      guild = await Guilds.getById(entity.Player.guild_id);
    } catch (error) {
      guild = null;
    }
  }

  const embed = new discord.MessageEmbed();

  if (guild === null) {
    return sendErrorMessage(
      message.author,
      message.channel,
      language,
      JsonReader.commands.guild.getTranslation(language).noGuildException);
  }
  const members = await Entities.getByGuild(guild.id);

  let membersInfos = '';
  for (const member of members) {
    membersInfos += format(JsonReader.commands.guild.getTranslation(language).memberinfos,
      {
        pseudo: await member.Player.getPseudo(language),
        ranking: (await Players.getById(member.Player.id))[0].rank,
        score: member.Player.score,
      });
  }

  const chief = await Players.findOne({ where: { id: guild.chief_id } });

  embed.setThumbnail(JsonReader.commands.guild.icon);

  embed.setTitle(format(JsonReader.commands.guild.getTranslation(language).title, {
    guildName: guild.name,
  }));
  embed.setDescription(format(JsonReader.commands.guild.getTranslation(language).chief, {
    pseudo: await chief.getPseudo(language),
  }));
  embed.addField(format(JsonReader.commands.guild.getTranslation(language).members, {
    memberCount: members.length,
    maxGuildMembers: GUILD.MAX_GUILD_MEMBER,
  }), membersInfos);
  if (guild.level < 100) {
    embed.addField(format(JsonReader.commands.guild.getTranslation(language).experience, {
      xp: guild.experience,
      xpToLevelUp: guild.getExperienceNeededToLevelUp(),
      level: guild.level,
    }), progressBar(guild.experience, guild.getExperienceNeededToLevelUp()));
  }else{
    embed.addField(JsonReader.commands.guild.getTranslation(language).lvlMax, progressBar(1, 1));
  }

  // embed.addField(Text.commands.guild.star + experience + Text.commands.guild.expSeparator + experienceToLevelUp
  //    + Text.commands.guild.guildLevel + level, Text.commands.guild.style + progressBar.createBar() + Text.commands.guild.style);

  message.channel.send(embed);
};

module.exports = {
  'guild': GuildCommand,
  'g': GuildCommand,
};
