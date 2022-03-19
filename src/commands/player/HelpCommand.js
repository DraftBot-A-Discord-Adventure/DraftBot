import {Entities} from "../../core/models/Entity";
import {isOnMainServer} from "../../core/utils/ShardUtils";

module.exports.commandInfo = {
	name: "help",
	aliases: ["h"]
};

/**
 * Displays commands of the bot for a player, if arg match one command explain that command
 * @param {Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Servers} from "../../core/models/Server";

const HelpCommand = async (message, language, args) => {
	let helpMessage;

	const [server] = await Servers.getOrRegister(message.guild.id);

	else {
		const command = getCommand(args[0]) || getCommandFromAlias(args[0]);
		let option1, option2;
		if (!command) {
			getCommand("help").execute(message, language, []);
			return;
		}
		const commandInfos = JsonReader.commands.help.getTranslation(language).commands[
			command.commandInfo.name
		];
		if (command === getCommand("petsell")) {
			option1 = PETS.SELL.MIN;
			option2 = PETS.SELL.MAX;
		}
		helpMessage = new DraftBotEmbed()
			.setDescription(format(commandInfos.description, {
				option1: option1,
				option2: option2
			}))
			.setTitle(
				format(
					JsonReader.commands.help.getTranslation(language).commandEmbedTitle,
					{emote: commandInfos.emote, cmd: command.commandInfo.name}
				)
			);
		helpMessage.addField(
			JsonReader.commands.help.getTranslation(language).usageFieldTitle,
			"`" + commandInfos.usage + "`",
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
	}

	const [entity] = await Entities.getOrRegister(message.author.id);
	if (!await isOnMainServer(entity.discordUserId) && entity.Player.dmNotification) {
		await sendDirectMessage(message.author, JsonReader.commands.help.getTranslation(language).mp.title,
			JsonReader.commands.help.getTranslation(language).mp.description, JsonReader.bot.embed.default, language);
	}

	await message.channel.send({ embeds: [helpMessage] });
};

module.exports.execute = HelpCommand;