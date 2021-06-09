module.exports.help = {
	name: "debugblocked"
};

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
module.exports.execute = async (message, language, args) => {
	if (await canPerformCommand(message, language,
		PERMISSION.ROLE.BOT_OWNER) !== true) {
		return;
	}

	if (args.length === 1) {
		if (!hasBlockedPlayer(args[0])) {
			await message.channel.send("Not blocked");
			return;
		}
		await message.channel.send(getBlockedPlayer(args[0]).context);
	}
};