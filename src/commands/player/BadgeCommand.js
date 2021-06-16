module.exports.help = {
	name: "badge",
	aliases: ["badges"]
};

/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 */
const BadgeCommand = (message, language) => {
	const command = getCommand("badge");
	const commandInfos = JsonReader.commands.help.getTranslation(language).commands[
		"badge"
	];
	helpMessage = new discord.MessageEmbed()
		.setColor(JsonReader.bot.embed.default)
		.setDescription(commandInfos.description)
		.setTitle(
			format(
				JsonReader.commands.help.getTranslation(language).commandEmbedTitle,
				{emote: commandInfos.emote, cmd: command.help.name}
			)
		);
	helpMessage.addField(
		JsonReader.commands.help.getTranslation(language).usageFieldTitle,
		"`" + commandInfos.usage + "`",
		true
	);

	if (command.help.aliases.length) {
		let aliasField = "";
		for (let i = 0; i < command.help.aliases.length; ++i) {
			aliasField += "`" + command.help.aliases[i] + "`";
			if (i !== command.help.aliases.length - 1) {
				aliasField += ", ";
			}
		}
		helpMessage.addField(
			command.help.aliases.length > 1 ? JsonReader.commands.help.getTranslation(language).aliasesFieldTitle : JsonReader.commands.help.getTranslation(language).aliasFieldTitle,
			aliasField,
			true
		);
	}

	message.channel.send(helpMessage);
};

module.exports.execute = BadgeCommand;