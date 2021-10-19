import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

module.exports.commandInfo = {
	name: "badge",
	aliases: ["badges"]
};

/**
 * Allow to use the object if the player has one in the dedicated slot of his inventory
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 */
const BadgeCommand = (message, language) => {
	const command = getCommand("badge");
	const commandData = JsonReader.commands.help.getTranslation(language).commands[
		"badge"
	];
	const helpMessage = new DraftBotEmbed()
		.setDescription(commandData.description)
		.setTitle(
			format(
				JsonReader.commands.help.getTranslation(language).commandEmbedTitle,
				{emote: commandData.emote, cmd: command.commandInfo.name}
			)
		);
	helpMessage.addField(
		JsonReader.commands.help.getTranslation(language).usageFieldTitle,
		"`" + commandData.usage + "`",
		true
	);

	if (command.commandInfo.aliases.length) {
		let aliasField = "";
		for (let i = 0; i < command.commandInfo.aliases.length; ++i) {
			aliasField += "`" + command.commandInfo.aliases[i] + "`";
			if (i !== command.commandInfo.aliases.length - 1) {
				aliasField += ", ";
			}
		}
		helpMessage.addField(
			command.commandInfo.aliases.length > 1 ? JsonReader.commands.help.getTranslation(language).aliasesFieldTitle : JsonReader.commands.help.getTranslation(language).aliasFieldTitle,
			aliasField,
			true
		);
	}

	message.channel.send({ embeds: [helpMessage] });
};

module.exports.execute = BadgeCommand;