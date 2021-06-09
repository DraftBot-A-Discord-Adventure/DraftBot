module.exports.help = {
	name: "dmnotification"
};

/**
 * Activate or desactivate DMs notifications.
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function DmnotificationCommand(language, message) {

	const [entity] = await Entities.getOrRegister(message.author.id); // Loading player
	const translations = JsonReader.commands.dmNotification.getTranslation(language);

	// update value user dmnotification
	entity.Player.dmnotification = !entity.Player.dmnotification;
	const isDmNotificationOn = entity.Player.dmnotification;

	// send message updated value
	const dmNotifEmbed = new discord.MessageEmbed()
		.setDescription(
			format(translations.normal, {
				pseudo: message.author.username,
				notifOnVerif: isDmNotificationOn ? translations.open : translations.closed
			})
		)
		.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(translations.title, {
			pseudo: message.author.username
		}), message.author.displayAvatarURL());
	if (isDmNotificationOn) {
		try {
			await message.author.send(dmNotifEmbed);
			await message.channel.send(dmNotifEmbed);
		}
		catch (err) {
			entity.Player.dmnotification = false;
			await sendErrorMessage(
				message.author,
				message.channel,
				language,
				translations.error
			);
		}

	}
	else {
		await message.channel.send(dmNotifEmbed);
	}
	log("Player " + message.author + " switched dms to " + entity.Player.dmnotification);
	await entity.Player.save();
}

module.exports.execute = DmnotificationCommand;