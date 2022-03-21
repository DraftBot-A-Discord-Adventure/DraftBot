import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {CommandRegisterPriority} from "../CommandRegisterPriority";

const {BlockingUtils} = require("../../core/utils/BlockingUtils");

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param interaction
 */
async function executeCommand(interaction: CommandInteraction): Promise<void> {
	const blockingReason = await BlockingUtils.getPlayerBlockingReason(interaction.options.getString("user"));
	if (blockingReason === null) {
		await interaction.reply({content: "Not blocked or the id given isn't a right user id", ephemeral: true});
		return;
	}
	await interaction.reply({content: blockingReason, ephemeral: true});
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
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true,
	slashCommandPermissions: null,
	registerPriority: CommandRegisterPriority.LOWEST
};