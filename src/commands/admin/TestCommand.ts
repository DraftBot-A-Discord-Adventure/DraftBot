import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction} from "discord.js";
import {botConfig} from "../../core/bot";

const CT = require("../../core/CommandsTest");

module.exports.commandInfo = {
	name: "test"
};

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
			testCommand = interaction.options.getString("testcommand").split(" ")[0];
		}
		catch { /* case no command given */
		}
		let argsTest: string | string[] = [];
		try {
			argsTest = interaction.options.getString("testcommand").split(" ")
				.slice(1);
		}
		catch { /* case no args given */
		}
		let commandTestCurrent;
		try {
			commandTestCurrent = await CT.getTestCommand(testCommand);
		}
		catch (e) {
			return interaction.reply({content: ":x: | Commande test " + testCommand + " inexistante : ```" + e.stack + "```"});
		}
		// Third, we check if the test command has the good arguments
		const testGoodFormat = CT.isGoodFormat(commandTestCurrent, argsTest, interaction);
		if (testGoodFormat[0]) {
			// Last, we execute the test command
			await CT.executeAndAlertUser(language, interaction, commandTestCurrent, argsTest);
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

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("test")
		.setDescription("Cheat command for testers (TEST MODE ONLY)")
		.addStringOption(builder => builder.setName("testcommand")
			.setDescription("The test command to execute")
			.setRequired(false)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: null
	},
	mainGuildCommand: false
};