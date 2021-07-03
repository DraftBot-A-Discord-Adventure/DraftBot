import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";

module.exports.help = {
	name: "help",
	aliases: ["h"],
	commandFormat: "<command>",
	typeWaited: {
		command: typeVariable.STRING
	},
	messageWhenExecuted: "",
	description: "Affiche l'aide pour une commande"
};

const CT = require("../../../../core/CommandsTest");

/**
 * Help the player about one given test command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {module:"discord.js".MessageEmbed} - The successful message formatted
 */
const helpTestCommand = async (language, message, args) => {
	let helpOnCommand;
	try {
		helpOnCommand = await CT.getTestCommand(args[0]);
	}
	catch (e) {
		throw new Error("Commande inexistante : " + args[0]);
	}
	const embedHelpTest = new DraftBotEmbed()
		.formatAuthor("Commande test : " + helpOnCommand.help.name, message.author)
		.addFields(
			{
				name: "Description",
				value: helpOnCommand.help.description
			},
			{
				name: "Utilisation",
				value: "`test " + helpOnCommand.help.name + (helpOnCommand.help.commandFormat === "" ? "" : " " + helpOnCommand.help.commandFormat) + "`"
			}
		)
		.setColor(TEST_EMBED_COLOR.SUCCESSFUL);
	if (helpOnCommand.help.typeWaited !== undefined) {
		if (Object.keys(helpOnCommand.help.typeWaited).length !== 0) {
			let reqArgs = "";
			Object.keys(helpOnCommand.help.typeWaited).forEach(arg => {
				reqArgs += "\n - `<" + arg + ">` : " + helpOnCommand.help.typeWaited[arg].type;
			});
			embedHelpTest.addField(Object.keys(helpOnCommand.help.typeWaited).length === 1 ? "Argument attendu : " : "Arguments attendus : ", reqArgs);
		}
	}
	if (helpOnCommand.help.aliases !== undefined) {
		if (helpOnCommand.help.aliases.length !== 0) {
			let aliases = "";
			helpOnCommand.help.aliases.forEach(alias => {
				aliases += "`" + alias + "`, ";
			});
			embedHelpTest.addField("Alias : ", aliases.slice(0, aliases.length - 2));
		}
	}
	return embedHelpTest;
};

module.exports.execute = helpTestCommand;