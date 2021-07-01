module.exports.help = {
	name: "give",
	aliases: [],
	userPermissions: ROLES.USER.BOT_OWNER
};

/**
 * Allow the bot owner to give an item to somebody
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const GiveCommand = async (message, language, args) => {
	const embed = new discord.MessageEmbed();
	const player = getUserFromMention(args[0]);
	const [entity] = await Entities.getOrRegister(player.id);
	const itemType = args[1];
	const itemId = args[2];
	await entity.Player.Inventory.giveObject(itemId, itemType);
	await entity.Player.Inventory.save();
	embed.setColor(JsonReader.bot.embed.default)
		.setAuthor(format(JsonReader.commands.giveCommand.getTranslation(language).giveSuccess, {pseudo: message.author.username}), message.author.displayAvatarURL())
		.setDescription(format(JsonReader.commands.giveCommand.getTranslation(language).descGive, {
			type: itemType,
			id: itemId,
			player: player
		}));
	return await message.channel.send(embed);
};

function getUserFromMention(mention) {
	if (!mention) {
		return;
	}

	if (mention.startsWith("<@") && mention.endsWith(">")) {
		mention = mention.slice(2, -1);

		if (mention.startsWith("!")) {
			mention = mention.slice(1);
		}

		return client.users.cache.get(mention);
	}
}

module.exports.execute = GiveCommand;