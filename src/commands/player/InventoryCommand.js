module.exports.help = {
	name: "inventory",
	aliases: ["inv", "i"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED]
};

/**
 * Displays the inventory of a player
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const InventoryCommand = async (message, language, args) => {
	let [entity] = await Entities.getByArgs(args, message);
	if (entity === null) {
		[entity] = await Entities.getOrRegister(message.author.id);
	}

	const inventoryEmbed = await entity.Player.Inventory.toEmbedObject(language);
	return await message.channel.send(
		new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.default)
			.setTitle(format(JsonReader.commands.inventory.getTranslation(language).title, {pseudo: await entity.Player.getPseudo(language)}))
			.addFields(inventoryEmbed)
	);
};

module.exports.execute = InventoryCommand;