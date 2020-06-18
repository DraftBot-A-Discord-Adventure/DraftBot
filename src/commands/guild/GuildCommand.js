/**
 * Allow to display the info of a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildCommand = async (language, message, args) => {

    let entity;

    try {
        entity = await Entities.getByArgs(args, message);
    } catch (error) {
        [entity] = await Entities.getOrRegister(message.author.id);
    }

    if (args.length > 0 && message.mentions.users.last() === undefined) {
        // args is the name of a guild
        try {
            guild = await Guilds.getByName(args.join(" "));
        } catch (error) {
            guild = null;
        }

    } else {
        // search for a user's guild
        try {
            guild = await Guilds.getById(entity.Player.guild_id);
        } catch (error) {
            guild = null;
        }
    }

    let embed = new discord.MessageEmbed();

    if (guild === null) {
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guild.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guild.getTranslation(language).noGuildException);
        return message.channel.send(embed);
    }
    let members = await Entities.getByGuild(guild.id);

    let membersInfos = "";
    for (const member of members) {
        membersInfos += format(JsonReader.commands.guild.getTranslation(language).memberinfos,
            {
                pseudo: client.users.cache.get(member.discordUser_id).toString(),
                ranking: (await Players.getById(member.Player.id))[0].rank,
                score: member.Player.score
            });
    }

    let chief = await Entities.getById(guild.chief_id);

    embed.setThumbnail(JsonReader.commands.guild.icon);

    embed.setTitle(format(JsonReader.commands.guild.getTranslation(language).title, {
        guildName: guild.name
    }));
    embed.setDescription(format(JsonReader.commands.guild.getTranslation(language).chief, {
        pseudo: client.users.cache.get(chief.discordUser_id).toString()
    }));
    embed.addField(format(JsonReader.commands.guild.getTranslation(language).members, {
        memberCount: members.length,
        maxGuildMembers: GUILD.MAX_GUILD_MEMBER
    }), membersInfos);
    embed.addField(format(JsonReader.commands.guild.getTranslation(language).experience, {
        xp: guild.experience,
        xpToLevelUp: guild.getExperienceNeededToLevelUp(),
        level: guild.level
    }), progressBar(guild.experience, guild.getExperienceNeededToLevelUp()));

    //embed.addField(Text.commands.guild.star + experience + Text.commands.guild.expSeparator + experienceToLevelUp
    //    + Text.commands.guild.guildLevel + level, Text.commands.guild.style + progressBar.createBar() + Text.commands.guild.style);

    message.channel.send(embed);
};

module.exports = {
    "guild": GuildCommand,
    "g": GuildCommand
};
