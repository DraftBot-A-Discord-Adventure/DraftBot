/**
 * Send database
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SendDataCommand = async (language, message, args) => {
	if ((await canPerformCommand(message, language,
		PERMISSION.ROLE.BOT_OWNER)) !== true) {
		return;
	}

	await message.channel.send({
		files: [{
			attachment: 'database/database.sqlite',
			name: 'database.sqlite',
		}],
	});
};

module.exports = {
	commands: [
		{
			name: 'senddata',
			func: SendDataCommand
		}
	]
};
