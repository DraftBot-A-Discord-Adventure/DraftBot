/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const SendPrivateMessage = async function (language, message, args) {

    if ((await canPerformCommand(message, language,
            PERMISSION.ROLE.SUPPORT)) !== true) {
        return;
    }

    var userId = args[0];
    var messageToSend = args.join(' ').replace(userId, '') +
        format(JsonReader.commands.sendPrivateMessage.getTranslation(language).signature, {
            username: message.author.username
        });

    if (userId === undefined || args[1] === undefined)
        return await sendErrorMessage(message, language);

    const user = client.users.cache.get(userId);
    let embed = new discord.MessageEmbed();
    embed.setColor(JsonReader.bot.embed.default)
        .setTitle(format(JsonReader.commands.sendPrivateMessage.getTranslation(language).title, {
            username: user.username
        }))
        .setDescription(JsonReader.commands.sendPrivateMessage.getTranslation(language).ok + messageToSend)
        .setImage(message.attachments.size > 0 ? [...message.attachments.values()][0].url : '');

    user.send(messageToSend);
    sendMessageAttachments(message, user);
    return await message.channel.send(embed);
};

/**
 * Send the error message for this command
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
async function sendErrorMessage(message, language) {
    return await message.channel.send(new discord.MessageEmbed().setColor(JsonReader.bot.embed.error)
        .setAuthor(format(JsonReader.commands.sendPrivateMessage.getTranslation(language).error, {
            pseudo: message.author.username
        }), message.author.displayAvatarURL())
        .setDescription(JsonReader.commands.sendPrivateMessage.getTranslation(language).descError));

}

module.exports = {
    'dm': SendPrivateMessage,
};