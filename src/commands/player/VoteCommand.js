module.exports.help = {
	name: "vote",
	aliases: ["ilovedraftbot", "votes"]
};

/**
 * Displays the changelog of the bot
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const VoteCommand = (message, language) => {
	message.channel.send(new DraftBotEmbed()
		.setDescription(JsonReader.commands.vote.getTranslation(language).text)
		.setTitle(JsonReader.commands.vote.getTranslation(language).title));
};

module.exports.execute = VoteCommand;
