/**
 * Allow to kick a member from a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildKickCommand = async (language, message, args) => {

    let entity, kickedEntity, guild, kickedGuild;
    let embed = new discord.MessageEmbed();

    [entity] = await Entities.getOrRegister(message.author.id);

    try {
        kickedEntity = await Entities.getByArgs(args, message);
    } catch (error) {
        kickedEntity = null;
    }

    if (kickedEntity == null) { //no user provided
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildKick.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildKick.getTranslation(language).cannotGetKickedUser);
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
            .setAuthor(format(JsonReader.commands.guildKick.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildKick.getTranslation(language).notInAguild);
        return message.channel.send(embed);
    }

    if (guild.chief_id != entity.id) {
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildKick.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildKick.getTranslation(language).notChiefError);
        return message.channel.send(embed);
    }

    // search for a user's guild
    try {
        kickedGuild = await Guilds.getById(kickedEntity.Player.guild_id);
    } catch (error) {
        kickedGuild = null;
    }

    if (kickedGuild == null || kickedGuild.id != guild.id) { // not the same guild
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildKick.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildKick.getTranslation(language).notInTheGuild);
        return message.channel.send(embed);
    }

    if (kickedEntity.id === entity.id) {
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildKick.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildKick.getTranslation(language).excludeHimself);
        return message.channel.send(embed);
    }


    embed.setAuthor(format(JsonReader.commands.guildKick.getTranslation(language).kickTitle, {
        pseudo: message.author.username
    }), message.author.displayAvatarURL());
    embed.setDescription(format(JsonReader.commands.guildKick.getTranslation(language).kick, {
        guildName: guild.name,
        kickedPseudo: message.mentions.users.last().username
    }));

    let msg = await message.channel.send(embed);

    embed = new discord.MessageEmbed();
    const filterConfirm = (reaction, user) => {
        return ((reaction.emoji.name == MENU_REACTION.ACCEPT || reaction.emoji.name == MENU_REACTION.DENY) && user.id === message.author.id);
    };

    const collector = msg.createReactionCollector(filterConfirm, {
        time: 120000,
        max: 1
    });

    collector.on('end', async (reaction) => {
        if (reaction.first()) { // a reaction exist
            if (reaction.first().emoji.name == MENU_REACTION.ACCEPT) {

                kickedEntity.Player.guild_id = null;

                await Promise.all([
                    kickedEntity.save(),
                    kickedEntity.Player.save()
                ]);

                embed.setAuthor(format(JsonReader.commands.guildKick.getTranslation(language).successTitle, {
                    kickedPseudo: message.mentions.users.last().username,
                    guildName: guild.name
                }), message.mentions.users.last().displayAvatarURL());
                embed.setDescription(JsonReader.commands.guildKick.getTranslation(language).kickSuccess);
                return message.channel.send(embed);
            }
        }

        //Cancel the creation
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildKick.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(format(JsonReader.commands.guildKick.getTranslation(language).kickCancelled, {
                kickedPseudo: message.mentions.users.last().username
            }));
        message.channel.send(embed);

    });

    await msg.react(MENU_REACTION.ACCEPT);
    await msg.react(MENU_REACTION.DENY);

};


module.exports = {
    "guildkick": GuildKickCommand,
    "gkick": GuildKickCommand,
    "gk": GuildKickCommand
};