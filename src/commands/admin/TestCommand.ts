import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {botConfig} from "../../core/bot";
import {CommandsTest} from "../../core/CommandsTest";

/**
 * Cheat command for testers
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	// First, we test if we are in test mode
	if (botConfig.TEST_MODE) {
		// Second, we collect the test commands entered
		let testCommands: string[];
		try {
			testCommands = (interaction.options.get("testcommand").value as string).split(" && ");
		}
		catch {
			testCommands = ["list"];
		}

		for (let testCommand of testCommands) {
			let argsTest: string[];
			try {
				argsTest = testCommand.split(" ").slice(1);
			}
			catch { /* case no args given */
			}

			testCommand = testCommand.split(" ")[0];

			let commandTestCurrent;
			try {
				commandTestCurrent = CommandsTest.getTestCommand(testCommand);
			}
			catch (e) {
				if (!interaction.replied) {
					await interaction.reply({content: `:x: | Commande test ${testCommand} inexistante : \`\`\`${e.stack}\`\`\``});
					return;
				}
				await interaction.channel.send({content: `:x: | Commande test ${testCommand} inexistante : \`\`\`${e.stack}\`\`\``});
				return;
			}

			// Third, we check if the test command has the good arguments
			const testGoodFormat = CommandsTest.isGoodFormat(commandTestCurrent, argsTest, interaction);
			if (testGoodFormat[0]) {
				// Last, we execute the test command
				await CommandsTest.executeAndAlertUser(language, interaction, commandTestCurrent, argsTest);
				continue;
			}

			try {
				await interaction.reply({embeds: [testGoodFormat[1]]});
			}
			catch {
				await interaction.followUp({embeds: [testGoodFormat[1]]});
			}
			return;
		}
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("test")
		.setDescription("Cheat command for testers (TEST MODE ONLY)")
		.addStringOption(builder => builder.setName("testcommand")
			.setDescription("The test command to execute")
			.setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {},
	mainGuildCommand: false
};