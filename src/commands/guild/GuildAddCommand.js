/**
 * Allow to add a member to a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildAddCommand = async (language, message, args) => {

    let entity, invitedEntity, guild, invitedGuild;
    let embed = new discord.MessageEmbed();

    [entity] = await Entities.getOrRegister(message.author.id);

    try {
        invitedEntity = await Entities.getByArgs(args, message);
    } catch (error) {
        invitedEntity = null;
    }

    if (invitedEntity == null) { //no user provided
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildAdd.getTranslation(language).cannotGetInvitedUser);
        return message.channel.send(embed);
    }

    // search for a user's guild
    try {
        guild = await Guilds.getById(entity.Player.guild_id);
    } catch (error) {
        guild = null;
    }

    if (guild == null) { // not in a guild
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildAdd.getTranslation(language).notInAguild);
        return message.channel.send(embed);
    }

    if (guild.chief_id != entity.id) {
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildAdd.getTranslation(language).notChiefError);
        return message.channel.send(embed);
    }

    // search for a user's guild
    try {
        invitedGuild = await Guilds.getById(invitedEntity.Player.guild_id);
    } catch (error) {
        invitedGuild = null;
    }

    if (invitedGuild != null) { // already in a guild
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildAdd.getTranslation(language).alreadyInAGuild);
        return message.channel.send(embed);
    }

    let members = await Entities.getByGuild(guild.id);

    if (members.length === GUILD.MAX_GUILD_MEMBER) {
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildAdd.getTranslation(language).guildFull);
        return message.channel.send(embed);
    }


    embed.setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).invitationTitle, {
        pseudo: message.mentions.users.last().username
    }), message.mentions.users.last().displayAvatarURL());
    embed.setDescription(format(JsonReader.commands.guildAdd.getTranslation(language).invitation, {
        guildName: guild.name
    }));

    let msg = await message.channel.send(embed);

    embed = new discord.MessageEmbed();
    const filterConfirm = (reaction, user) => {
        return ((reaction.emoji.name == MENU_REACTION.ACCEPT || reaction.emoji.name == MENU_REACTION.DENY) && user.id === message.mentions.users.last().id);
    };

    const collector = msg.createReactionCollector(filterConfirm, {
        time: 120000,
        max: 1
    });

    collector.on('end', async (reaction) => {
        if (reaction.first()) { // a reaction exist
            if (reaction.first().emoji.name == MENU_REACTION.ACCEPT) {

                invitedEntity.Player.guild_id = guild.id;
                //TODO : update lastDaily

                await Promise.all([
                    invitedEntity.save(),
                    invitedEntity.Player.save()
                ]);

                embed.setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).successTitle, {
                    pseudo: message.mentions.users.last().username,
                    guildName: guild.name
                }), message.mentions.users.last().displayAvatarURL());
                embed.setDescription(JsonReader.commands.guildAdd.getTranslation(language).invitationSuccess);
                return message.channel.send(embed);
            }
        }

        //Cancel the creation
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildAdd.getTranslation(language).errorTitle, {
                pseudo: message.mentions.users.last().username
            }), message.mentions.users.last().displayAvatarURL())
            .setDescription(format(JsonReader.commands.guildAdd.getTranslation(language).invitationCancelled, {
                guildName: guild.name
            }));
        message.channel.send(embed);

    });

    await msg.react(MENU_REACTION.ACCEPT);
    await msg.react(MENU_REACTION.DENY);

};


module.exports = {
    "guildAdd": GuildAddCommand,
    "gAdd": GuildAddCommand,
    "ga": GuildAddCommand
};