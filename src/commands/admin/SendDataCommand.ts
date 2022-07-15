import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";

/**
 * Send database
 * @param interaction
 */
async function executeCommand(interaction: CommandInteraction): Promise<void> {
	await interaction.deferReply();
	await interaction.editReply({
		files: [{
			attachment: "database/database.sqlite",
			name: "database.sqlite"
		}]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("senddata")
		.setDescription("Sends the database (admin only)"),
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};