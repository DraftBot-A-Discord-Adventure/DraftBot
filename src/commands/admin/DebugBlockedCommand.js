module.exports.commandInfo = {
	name: "debugblocked",
	aliases: [],
	userPermissions: ROLES.USER.BOT_OWNER
};

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const DebugBlockedCommand = async (message, language, args) => {
	if (args.length === 1) {
		if (!hasBlockedPlayer(args[0])) {
			await message.channel.send("Not blocked");
			return;
		}
		await message.channel.send(getBlockedPlayer(args[0]).context);
	}
};

module.exports.execute = DebugBlockedCommand;