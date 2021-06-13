module.exports.help = {
	name: "senddata",
	aliases: [],
	userPermissions: ROLES.USER.BOT_OWNER
};

/**
 * Send database
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const SendDataCommand = async (message) => {
	await message.channel.send({
		files: [{
			attachment: "database/database.sqlite",
			name: "database.sqlite"
		}]
	});
};

module.exports.execute = SendDataCommand;