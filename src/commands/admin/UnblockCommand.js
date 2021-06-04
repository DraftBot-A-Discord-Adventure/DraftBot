module.exports.help = {
	name : "unblock"
};

/**
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
module.exports.execute = async (message, language, args) => {
	if ((await canPerformCommand(message, language,
		PERMISSION.ROLE.BOT_OWNER)) !== true) {
		return;
	}

	if (args.length === 1) {
		if (!hasBlockedPlayer(args[0])) {
			await message.channel.send("Not blocked");
			return;
		}
		removeBlockedPlayer(args[0]);
		await message.channel.send("Unblocked with success");
		const user = await client.users.fetch(args[0]);
		const [entity] = await Entities.getOrRegister(args[0]);
		if (entity.Player.dmnotification) {
			sendDirectMessage(
				user,
				JsonReader.commands.unblock.getTranslation(language).title,
				JsonReader.commands.unblock.getTranslation(language).description,
				JsonReader.bot.embed.default,
				language
			);
		}


	}
	else {
		await message.channel.send("Usage: !unblock <discord id>");
	}
};