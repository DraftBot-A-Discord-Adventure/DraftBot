import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

module.exports.commandInfo = {
	name: "dmNotification",
	aliases: ["dmn","notifs","dms","notif","dmNotifications"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD]
};

/**
 * Activate or desactivate DMs notifications.
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 */

const DmNotificationCommand = async (message, language) => {


	const [entity] = await Entities.getOrRegister(message.author.id); // Loading player
	const translations = JsonReader.commands.dmNotification.getTranslation(language);

	// update value user dmNotification
	entity.Player.dmNotification = !entity.Player.dmNotification;
	const isDmNotificationOn = entity.Player.dmNotification;

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
			await message.author.send({ embeds: [dmNotificationEmbed] });
			await message.channel.send({ embeds: [dmNotificationEmbed] });
		}
		catch (err) {
			entity.Player.dmNotification = false;
			await sendErrorMessage(
				message.author,
				message.channel,
				language,
				translations.error
			);
		}

	}
	else {
		await message.channel.send({ embeds: [dmNotificationEmbed] });
	}
	log("Player " + message.author + " switched dms to " + entity.Player.dmNotification);
	await entity.Player.save();
};

module.exports.execute = DmNotificationCommand;
