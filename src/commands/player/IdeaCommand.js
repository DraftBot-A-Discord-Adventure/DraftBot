module.exports.commandInfo = {
	name: "idea",
	aliases: ["ideas","suggestions","suggestion","suggest"]
};

/**
 * Displays the link for the idea board
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const IdeaCommand = (message, language) => {
	message.channel.send({ embeds: [
		new DraftBotEmbed().setDescription(JsonReader.commands.idea.getTranslation(language).text)
			.setTitle(JsonReader.commands.idea.getTranslation(language).title)
	] });
};

module.exports.execute = IdeaCommand;