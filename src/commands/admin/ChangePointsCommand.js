/**
 * Allow the bot owner to give an item to somebody
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const ChangePointsCommand = async function(language, message, args) {
	if (await canPerformCommand(message, language,
		PERMISSION.ROLE.BOT_OWNER) !== true) {
		return;
	}

	const playerId = message.mentions.users.last().id;
	const [entity] = await Entities.getOrRegister(playerId);
	entity.Player.score = parseInt(args[1]);
	await entity.Player.save();

	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.points.getTranslation(language).title, message.author)
		.setDescription(format(JsonReader.commands.points.getTranslation(language).desc,{player: args[0], points: args[1]})));
};

module.exports = {
	commands: [
		{
			name: "points",
			func: ChangePointsCommand
		}
	]
};

