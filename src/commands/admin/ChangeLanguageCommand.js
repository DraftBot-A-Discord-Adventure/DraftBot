/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const changeLanguageCommand = async function(language, message) {
	if (await canPerformCommand(message, language,
		PERMISSION.ROLE.ADMINISTRATOR) !== true) {
		return;
	}

	const [server] = await Servers.getOrRegister(message.guild.id);
	if (server.language === LANGUAGE.FRENCH) {
		server.language = LANGUAGE.ENGLISH;
	}
	else {
		server.language = LANGUAGE.FRENCH;
	}
	await server.save();
	await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.changeLanguage.getTranslation(language).title, message.author)
		.setDescription(JsonReader.commands.changeLanguage.getTranslation(language).desc));
};

module.exports = {
	commands: [
		{
			name: "language",
			func: changeLanguageCommand
		}
	]
};


