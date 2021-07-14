import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

module.exports.help = {
	name: "dmnotification",
	aliases: ["dmn","notifs","dms","notif","dmnotifications"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED]
};

/**
 * Activate or desactivate DMs notifications.
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const DmnotificationCommand = async (message, language) => {

	const [entity] = await Entities.getOrRegister(message.author.id); // Loading player
	const translations = JsonReader.commands.dmNotification.getTranslation(language);

	// update value user dmnotification
	entity.Player.dmnotification = !entity.Player.dmnotification;
	const isDmNotificationOn = entity.Player.dmnotification;

	// send message updated value
	const dmNotificationEmbed = new DraftBotEmbed()
		.setDescription(
			format(translations.normal, {
				pseudo: message.author.username,
				notifOnVerif: isDmNotificationOn ? translations.open : translations.closed
			})
		)
		.formatAuthor(translations.title, message.author);
	if (isDmNotificationOn) {
		try {
			await message.author.send(dmNotificationEmbed);
			await message.channel.send(dmNotificationEmbed);
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
		await message.channel.send(dmNotificationEmbed);
	}
	log("Player " + message.author + " switched dms to " + entity.Player.dmnotification);
	await entity.Player.save();
};

module.exports.execute = DmnotificationCommand;