module.exports.commandInfo = {
	name: "points",
	aliases: [],
	userPermissions: ROLES.USER.BOT_OWNER
};

/**
 * Allow the bot owner to give an item to somebody
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const ChangePointsCommand = async (message, language, args) => {
	const playerId = message.mentions.users.last().id;
	const [entity] = await Entities.getOrRegister(playerId);
	entity.Player.score = parseInt(args[1]);
	await entity.Player.save();

	return await message.channel.send(new DraftBotEmbed()
		.formatAuthor(JsonReader.commands.points.getTranslation(language).title, message.author)
		.setDescription(format(JsonReader.commands.points.getTranslation(language).desc,{player: args[0], points: args[1]})));
};

module.exports.execute = ChangePointsCommand;