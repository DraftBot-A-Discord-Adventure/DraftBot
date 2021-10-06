module.exports.commandInfo = {
	name: "invite",
	aliases: ["addbot"]
};

/**
 * Display the link to invite the bot to another server
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const InviteCommand = async (message, language) => {
	await message.channel.send({ content: JsonReader.commands.invite.getTranslation(language).main });
};

module.exports.execute = InviteCommand;