const {BlockingUtils} = require("../../core/utils/BlockingUtils");
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
		const blockingReason = BlockingUtils.getPlayerBlockingReason(args[0]);
		if (await blockingReason === null) {
			await message.channel.send({ content: "Not blocked" });
			return;
		}
		await message.channel.send({ content: blockingReason });
	}
};

module.exports.execute = DebugBlockedCommand;