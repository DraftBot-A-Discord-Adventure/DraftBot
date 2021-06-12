/**
 * Displays the changelog of the bot
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

function updateCommand(language, message) {
	const updateEmbed = new DraftBotEmbed()
		.setDescription(format(JsonReader.commands.update.getTranslation(language).text,
			{
				version: JsonReader.package.version
			}))
		.setTitle(JsonReader.commands.update.getTranslation(language).title);
	message.channel.send(updateEmbed);
}

module.exports = {
	commands: [
		{
			name: "update",
			func: updateCommand,
			aliases: ["changelog"]
		}
	]
};