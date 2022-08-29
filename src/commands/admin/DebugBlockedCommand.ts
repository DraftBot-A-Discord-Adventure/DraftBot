import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";

const {BlockingUtils} = require("../../core/utils/BlockingUtils");

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param interaction
 */
async function executeCommand(interaction: CommandInteraction): Promise<void> {
	const blockingReason = await BlockingUtils.getPlayerBlockingReason(interaction.options.getString("user"));
	if (blockingReason.length === 0) {
		await interaction.reply({content: "Not blocked or the id given isn't a right user id", ephemeral: true});
		return;
	}
	await interaction.reply({content: `Blocking reason: ${blockingReason}`, ephemeral: true});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("debugblocked")
		.setDescription("Give the blocked reason of a given user (admin only)")
		.addStringOption(option => option.setName("user")
			.setDescription("The user you want more info about its block reasons")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};