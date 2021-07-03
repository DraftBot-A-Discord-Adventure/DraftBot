module.exports.help = {
	name: "help",
	aliases: ["h"]
};

/**
 * Displays commands of the bot for a player, if arg match one command explain that command
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";

const HelpCommand = async (message, language, args) => {
	let helpMessage;

	const [server] = await Servers.getOrRegister(message.guild.id);

	if (!args.length) {
		helpMessage = new DraftBotEmbed();
		const commandsList = Object.entries(
			JsonReader.commands.help.getTranslation(language).commands
		);
		const serverCommands = Object.keys(
			Object.fromEntries(
				commandsList.filter(
					(command) => command[1].category === CATEGORY.SERVER
				)
			)
		);
		const utilCommands = Object.keys(
			Object.fromEntries(
				commandsList.filter((command) => command[1].category === CATEGORY.UTIL)
			)
		);
		const playerCommands = Object.keys(
			Object.fromEntries(
				commandsList.filter(
					(command) => command[1].category === CATEGORY.PLAYER
				)
			)
		);
		const guildCommands = Object.keys(
			Object.fromEntries(
				commandsList.filter((command) => command[1].category === CATEGORY.GUILD)
			)
		);
		const petCommands = Object.keys(
			Object.fromEntries(
				commandsList.filter((command) => command[1].category === CATEGORY.PET)
			)
		);

		helpMessage.formatAuthor(JsonReader.commands.help.getTranslation(language).helpEmbedTitle, message.author);
		helpMessage.setDescription(
			JsonReader.commands.help.getTranslation(language).helpEmbedDescription,
			"\n\u200b"
		);
		helpMessage.addFields([
			{
				name: JsonReader.commands.help.getTranslation(language).serverCommands,
				value: `${serverCommands.sort().join(" • ")}`
			},
			{
				name: JsonReader.commands.help.getTranslation(language).utilCommands,
				value: `${utilCommands.sort().join(" • ")}`
			},
			{
				name: JsonReader.commands.help.getTranslation(language).playerCommands,
				value: `${playerCommands.join(" • ")}`
			},
			{
				name: JsonReader.commands.help.getTranslation(language).guildCommands,
				value: `${guildCommands.sort().join(" • ")}`
			},
			{
				name: JsonReader.commands.help.getTranslation(language).petCommands,
				value: `${petCommands.sort().join(" • ")} \n\u200b`
			},
			{
				name: JsonReader.commands.help.getTranslation(language).forMoreHelp,
				value: format(JsonReader.commands.help.getTranslation(language)
					.forMoreHelpValue, {prefix: server.prefix}
				)
			}
		]);
	}
	else {
		const command = getCommand(args[0]) || getCommandFromAlias(args[0]);
		const commandInfos = JsonReader.commands.help.getTranslation(language).commands[
			command.help.name
		];
		helpMessage = new DraftBotEmbed()
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
	}

	const [entity] = await Entities.getOrRegister(message.author.id);
	if (
		client.guilds.cache
			.get(JsonReader.app.MAIN_SERVER_ID)
			.members.cache.find(
				(val) =>
					val.id === message.author.id) === undefined && entity.Player.dmnotification
	) {
		await sendDirectMessage(message.author, JsonReader.commands.help.getTranslation(language).mp.title,
			JsonReader.commands.help.getTranslation(language).mp.description, JsonReader.bot.embed.default, language);
	}

	await message.channel.send(helpMessage);
};

module.exports.execute = HelpCommand;