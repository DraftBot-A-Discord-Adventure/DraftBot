import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {botConfig} from "../../core/bot";
import {CommandsTest} from "../../core/CommandsTest";
import {Translations} from "../../core/Translations";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Cheat command for testers
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	// First, we test if we are in test mode
	if (botConfig.TEST_MODE) {
		// Second, we collect the test command entered
		let testCommand = "list";
		try {
			testCommand = (interaction.options.get("testcommand").value as string).split(" ")[0];
		}
		catch { /* case no command given */
		}
		let argsTest: string | string[] = [];
		try {
			argsTest = (interaction.options.get("testcommand").value as string).split(" ")
				.slice(1);
		}
		catch { /* case no args given */
		}
		let commandTestCurrent;
		try {
			commandTestCurrent = CommandsTest.getTestCommand(testCommand);
		}
		catch (e) {
			await interaction.reply({content: `:x: | Commande test ${testCommand} inexistante : \`\`\`${e.stack}\`\`\``});
			return;
		}
		// Third, we check if the test command has the good arguments
		const testGoodFormat = CommandsTest.isGoodFormat(commandTestCurrent, argsTest, interaction);
		if (testGoodFormat[0]) {
			// Last, we execute the test command
			await CommandsTest.executeAndAlertUser(language, interaction, commandTestCurrent, argsTest);
		}
		else {
			try {
				await interaction.reply({embeds: [testGoodFormat[1]]});
			}
			catch {
				await interaction.followUp({embeds: [testGoodFormat[1]]});
			}
		}
	}
}

const currentCommandFrenchTranslations = Translations.getModule("commands.test", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.test", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations,currentCommandEnglishTranslations)
		.addStringOption(builder => builder.setName("testcommand")
			.setDescription("The test command to execute")
			.setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};