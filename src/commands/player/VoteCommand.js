/**
 * Displays the changelog of the bot
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

function VoteCommand(language, message) {
	message.channel.send(new DraftBotEmbed()
		.setDescription(JsonReader.commands.vote.getTranslation(language).text)
		.setTitle(JsonReader.commands.vote.getTranslation(language).title));
}

module.exports = {
	commands: [
		{
			name: "vote",
			func: VoteCommand,
			aliases: ["votes","ilovedraftbot"]
		}
	]
};