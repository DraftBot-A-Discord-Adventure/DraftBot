import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";

const CT = require("../../../../core/CommandsTest");

/**
 * Help the player about one given test command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const helpTestCommand = async (language, interaction, args) => {
	let helpOnCommand;
	try {
		helpOnCommand = await CT.getTestCommand(args[0]);
	}
	catch (e) {
		throw new Error("Commande inexistante : " + args[0]);
	}
	const embedHelpTest = new DraftBotEmbed()
		.formatAuthor("Commande test : " + helpOnCommand.name, interaction.user)
		.addFields(
			{
				name: "Description",
				value: helpOnCommand.description
			},
			{
				name: "Utilisation",
				value: "`test " + helpOnCommand.name + (helpOnCommand.commandFormat === "" ? "" : " " + helpOnCommand.commandFormat) + "`"
			}
		)
		.setColor(TEST_EMBED_COLOR.SUCCESSFUL);
	if (helpOnCommand.typeWaited !== undefined) {
		if (Object.keys(helpOnCommand.typeWaited).length !== 0) {
			let reqArgs = "";
			Object.keys(helpOnCommand.typeWaited).forEach(arg => {
				reqArgs += "\n - `<" + arg + ">` : " + helpOnCommand.typeWaited[arg].type;
			});
			embedHelpTest.addField(Object.keys(helpOnCommand.typeWaited).length === 1 ? "Argument attendu : " : "Arguments attendus : ", reqArgs);
		}
	}
	if (helpOnCommand.aliases !== undefined) {
		if (helpOnCommand.aliases.length !== 0) {
			let aliases = "";
			helpOnCommand.aliases.forEach(alias => {
				aliases += "`" + alias + "`, ";
			});
			embedHelpTest.addField("Alias : ", aliases.slice(0, aliases.length - 2));
		}
	}
	return embedHelpTest;
};

module.exports.commandInfo = {
	name: "help",
	aliases: ["h"],
	commandFormat: "<command>",
	typeWaited: {
		command: typeVariable.STRING
	},
	messageWhenExecuted: "",
	description: "Affiche l'aide pour une commande",
	commandTestShouldReply: true,
	execute: helpTestCommand
};