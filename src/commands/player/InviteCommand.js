module.exports.help = {
	name: "invite",
	aliases: []
};

/**
 * Display the link to invite the bot to another server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const InviteCommand = async (message, language) => {
	await message.channel.send(JsonReader.commands.invite.getTranslation(language).main);
};

module.exports.execute = InviteCommand;