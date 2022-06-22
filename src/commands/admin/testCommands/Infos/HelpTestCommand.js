import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";

module.exports.commandInfo = {
	name: "help",
	aliases: ["h"],
	commandFormat: "<command>",
	typeWaited: {
		command: typeVariable.STRING
	},
	messageWhenExecuted: "",
	description: "Affiche l'aide pour une commande",
	commandTestShouldReply: true
};

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
		.formatAuthor("Commande test : " + helpOnCommand.commandInfo.name, interaction.user)
		.addFields(
			{
				name: "Description",
				value: helpOnCommand.commandInfo.description
			},
			{
				name: "Utilisation",
				value: "`test " + helpOnCommand.commandInfo.name + (helpOnCommand.commandInfo.commandFormat === "" ? "" : " " + helpOnCommand.commandInfo.commandFormat) + "`"
			}
		)
		.setColor(TEST_EMBED_COLOR.SUCCESSFUL);
	if (helpOnCommand.commandInfo.typeWaited !== undefined) {
		if (Object.keys(helpOnCommand.commandInfo.typeWaited).length !== 0) {
			let reqArgs = "";
			Object.keys(helpOnCommand.commandInfo.typeWaited).forEach(arg => {
				reqArgs += "\n - `<" + arg + ">` : " + helpOnCommand.commandInfo.typeWaited[arg].type;
			});
			embedHelpTest.addField(Object.keys(helpOnCommand.commandInfo.typeWaited).length === 1 ? "Argument attendu : " : "Arguments attendus : ", reqArgs);
		}
	}
	if (helpOnCommand.commandInfo.aliases !== undefined) {
		if (helpOnCommand.commandInfo.aliases.length !== 0) {
			let aliases = "";
			helpOnCommand.commandInfo.aliases.forEach(alias => {
				aliases += "`" + alias + "`, ";
			});
			embedHelpTest.addField("Alias : ", aliases.slice(0, aliases.length - 2));
		}
	}
	return embedHelpTest;
};

module.exports.execute = helpTestCommand;