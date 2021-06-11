module.exports.help = {
	name: "senddata",
	aliases: []
};

/**
 * Send database
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SendDataCommand = async (message, language) => {
	if (await canPerformCommand(message, language,
		PERMISSION.ROLE.BOT_OWNER) !== true) {
		return;
	}

	await message.channel.send({
		files: [{
			attachment: "database/database.sqlite",
			name: "database.sqlite"
		}]
	});
};

module.exports.execute = SendDataCommand;