import {DraftBotEmbed} from "../../../../core/messages/DraftBotEmbed";
import {CommandInteraction} from "discord.js";
import {CommandsTest, ITestCommand} from "../../../../core/CommandsTest";
import {Constants} from "../../../../core/Constants";

export const commandInfo: ITestCommand = {
	name: "help",
	aliases: ["h"],
	commandFormat: "<command>",
	typeWaited: {
		command: Constants.TEST_VAR_TYPES.STRING
	},
	messageWhenExecuted: "",
	description: "Affiche l'aide pour une commande",
	commandTestShouldReply: true,
	execute: null // defined later
};

/**
 * Help the player about one given test command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param interaction
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const helpTestCommand = (language: string, interaction: CommandInteraction, args: string[]): DraftBotEmbed => {
	let helpOnCommand: ITestCommand;
	try {
		helpOnCommand = CommandsTest.getTestCommand(args[0]);
	}
	catch (e) {
		throw new Error(`Commande inexistante : ${args[0]}`);
	}
	const embedHelpTest = new DraftBotEmbed()
		.formatAuthor(`Commande test : ${helpOnCommand.name}`, interaction.user)
		.addFields(
			{
				name: "Description",
				value: helpOnCommand.description
			},
			{
				name: "Utilisation",
				value: `\`test ${helpOnCommand.name}${helpOnCommand.commandFormat === "" ? "" : ` ${helpOnCommand.commandFormat}`}\``
			}
		)
		.setColor(Constants.TEST_EMBED_COLOR.SUCCESSFUL);
	if (helpOnCommand.typeWaited && Object.keys(helpOnCommand.typeWaited).length !== 0) {
		let reqArgs = "";
		Object.keys(helpOnCommand.typeWaited).forEach(arg => {
			reqArgs += `\n - \`<${arg}>\` : ${helpOnCommand.typeWaited[arg].type}`;
		});
		embedHelpTest.addFields({
			name: Object.keys(helpOnCommand.typeWaited).length === 1 ? "Argument attendu : " : "Arguments attendus : ",
			value: reqArgs
		});
	}
	if (helpOnCommand.aliases && helpOnCommand.aliases.length !== 0) {
		let aliases = "";
		helpOnCommand.aliases.forEach(alias => {
			aliases += `\`${alias}\`, `;
		});
		embedHelpTest.addFields({name: "Alias : ", value: aliases.slice(0, aliases.length - 2)});
	}
	return embedHelpTest;
};

commandInfo.execute = helpTestCommand as unknown as typeof commandInfo.execute;