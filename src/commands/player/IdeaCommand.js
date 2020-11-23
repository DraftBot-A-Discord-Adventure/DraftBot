/**
 * Displays the link for the idea board
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function ideaCommand(language, message, args) {
    const ideaEmbed = new discord.MessageEmbed()
        .setDescription(JsonReader.commands.idea.getTranslation(language).text)
        .setTitle(JsonReader.commands.idea.getTranslation(language).title)
        .setColor(JsonReader.bot.embed.default)
    message.channel.send(ideaEmbed);
}

module.exports = {
    commands: [
        {
            name: 'idea',
            func: ideaCommand,
            aliases: ['ideas', 'suggestions', 'suggest', 'suggestion']
        }
    ]
};