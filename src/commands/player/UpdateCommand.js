module.exports.commandInfo = {
	name: "update",
	aliases: ["changelog"]
};

/**
 * Displays the changelog of the bot
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const UpdateCommand = (message, language) => {
	message.channel.send({ embeds: [new DraftBotEmbed()
		.setDescription(format(JsonReader.commands.update.getTranslation(language).text,
			{
				version: JsonReader.package.version
			}))
		.setTitle(JsonReader.commands.update.getTranslation(language).title)] });
};

module.exports.execute = UpdateCommand;