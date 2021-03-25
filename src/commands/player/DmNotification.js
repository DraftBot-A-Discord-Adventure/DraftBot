/**
 * Activate or desactivate DMs notifications.
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
async function DmnotificationCommand(language, message, args) {
	
	let [entity] = await Entities.getOrRegister(message.author.id); // Loading player
	const translations = JsonReader.commands.guildDaily.getTranslation(language);
	
	// update value user dmnotifications
	entity.Player.dmnotifications = !entity.Player.dmnotifications;
	let isDmNotificationsOn = entity.Player.dmnotifications;

	// send message updated value
	const dmNotifEmbed = new discord.MessageEmbed()
		.setDescription(
			format(translations.normal, {
				pseudo : message.author.username,
				notifOnVerif : isDmNotificationsOn ? translations.open : translations.closed
			})
		)
		.setTitle(translations.title)
		.setColor(JsonReader.bot.embed.default);

	message.author.send(dmNotifEmbed)
		.catch(() => 
			entity.Player.dmnotifications = false,
			sendErrorMessage(
						message.author,
						message.channel,
						language,
						translations.error
			)
		)
}

module.exports = {
	commands: [
		{
			name: 'dmnotification',
			func: DmnotificationCommand,
			aliases: ['dmn','dm','dms']
		}
	]
};