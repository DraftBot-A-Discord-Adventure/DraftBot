/**
 * Allow to Create a guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GuildCreateCommand = async (language, message, args) => {

    let entity, guild;
    let embed = new discord.MessageEmbed();

    [entity] = await Entities.getOrRegister(message.author.id);

    // search for a user's guild
    try {
        guild = await Guilds.getById(entity.Player.guild_id);
    } catch (error) {
        guild = null;
    }

    if (guild !== null) { // already in a guild
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.guildAdd.getTranslation(language).alreadyInAGuild);
    }

    let askedName = args.join(" ");

    if (askedName.length < 1) { // no name provided        
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.guildAdd.getTranslation(language).noNameProvided);
    }

    const regexAllowed = RegExp(/^[A-Za-z0-9 ÇçÜüÉéÂâÄäÀàÊêËëÈèÏïÎîÔôÖöÛû]+$/);
    const regexSpecialCases = RegExp(/^[0-9 ]+$|( {2})+/);
    if (!(regexAllowed.test(askedName) && !regexSpecialCases.test(askedName) && askedName.length >= GUILD.MIN_GUILDNAME_SIZE && askedName.length <= GUILD.MAX_GUILDNAME_SIZE)) {

        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            format(JsonReader.commands.guildCreate.getTranslation(language).invalidName, {
                min: GUILD.MIN_GUILDNAME_SIZE,
                max: GUILD.MAX_GUILDNAME_SIZE
            }));
    }

    try {
        guild = await Guilds.getByName(args.join(" "));
    } catch (error) {
        guild = null;
    }

    if (guild !== null) { // the name is already used
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.guildAdd.getTranslation(language).nameAlreadyUsed);
    }

    embed.setAuthor(format(JsonReader.commands.guildCreate.getTranslation(language).buyTitle, {
        pseudo: message.author.username
    }), message.author.displayAvatarURL());
    embed.setDescription(format(JsonReader.commands.guildCreate.getTranslation(language).buyConfirm, {
        guildName: askedName,
        price: JsonReader.commands.guildCreate.guildCreationPrice,
    }));
    embed.setFooter(JsonReader.commands.guildCreate.getTranslation(language).buyFooter, null);

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

                if (entity.Player.money > JsonReader.commands.guildCreate.guildCreationPrice) {
                    embed.setColor(JsonReader.bot.embed.error)
                        .setAuthor(format(JsonReader.commands.guildCreate.getTranslation(language).errorTitle, {
                            pseudo: message.author.username
                        }), message.author.displayAvatarURL())
                        .setDescription(JsonReader.commands.guildCreate.getTranslation(language).notEnoughMoney);
                    return message.channel.send(embed);
                }

                const newGuild = await Guilds.create({
                    name: askedName,
                    chief_id: entity.id
                });

                entity.Player.guild_id = newGuild.id;
                entity.Player.addMoney(-JsonReader.commands.guildCreate.guildCreationPrice);

                await Promise.all([
                    entity.save(),
                    entity.Player.save()
                ]);

                embed.setAuthor(format(JsonReader.commands.guildCreate.getTranslation(language).createTitle, {
                    pseudo: message.author.username
                }), message.author.displayAvatarURL());
                embed.setDescription(format(JsonReader.commands.guildCreate.getTranslation(language).createSuccess, {
                    guildName: askedName
                }));
                return message.channel.send(embed);
            }
        }

        //Cancel the creation
        return sendErrorMessage(
            message.author,
            message.channel,
            language,
            JsonReader.commands.guildAdd.getTranslation(language).creationCancelled);
    });

    await msg.react(MENU_REACTION.ACCEPT);
    await msg.react(MENU_REACTION.DENY);

};


module.exports = {
    "guildcreate": GuildCreateCommand,
    "gcreate": GuildCreateCommand,
    "gc": GuildCreateCommand
};