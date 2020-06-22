/**
 * Allow to leave a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildLeaveCommand = async (language, message, args) => {

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
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildLeave.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(JsonReader.commands.guildLeave.getTranslation(language).notInAGuild);
        return message.channel.send(embed);
    }

    //generate confirmation embed
    embed.setAuthor(format(JsonReader.commands.guildLeave.getTranslation(language).leaveTitle, {
        pseudo: message.author.username
    }), message.author.displayAvatarURL());
    if (guild.chief_id != entity.id) {
        embed.setDescription(format(JsonReader.commands.guildLeave.getTranslation(language).leaveDesc, {
            guildName: guild.name
        }));
    } else {
        embed.setDescription(format(JsonReader.commands.guildLeave.getTranslation(language).leaveChiefDesc, {
            guildName: guild.name
        }));
    }

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
                entity.Player.guild_id = null;

                if (guild.chief_id == entity.id) {
                    //the chief is leaving : destroy the guild
                    await Players.update({ guild_id: null }, {
                        where: {
                            guild_id: guild.id
                        }
                    });
                    await Guilds.destroy({
                        where: {
                          id: guild.id
                        }
                      });
                }

                await Promise.all([
                    entity.save(),
                    entity.Player.save()
                ]);

                embed.setAuthor(format(JsonReader.commands.guildLeave.getTranslation(language).successTitle, {
                    pseudo: message.author.username,
                    guildName: guild.name
                }), message.author.displayAvatarURL());
                embed.setDescription(JsonReader.commands.guildLeave.getTranslation(language).leavingSuccess);
                return message.channel.send(embed);
            }
        }

        //Cancel leaving
        embed.setColor(JsonReader.bot.embed.error)
            .setAuthor(format(JsonReader.commands.guildLeave.getTranslation(language).errorTitle, {
                pseudo: message.author.username
            }), message.author.displayAvatarURL())
            .setDescription(format(JsonReader.commands.guildLeave.getTranslation(language).leavingCancelled, {
                guildName: guild.name
            }));
        message.channel.send(embed);

    });

    await msg.react(MENU_REACTION.ACCEPT);
    await msg.react(MENU_REACTION.DENY);

};

module.exports = {
    "guildleave": GuildLeaveCommand,
    "gleave": GuildLeaveCommand,
    "gl": GuildLeaveCommand
};
