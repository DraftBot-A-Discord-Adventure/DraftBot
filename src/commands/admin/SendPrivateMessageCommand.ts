import {escapeUsername} from "../../core/utils/StringUtils";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction, TextChannel, User} from "discord.js";
import {Translations} from "../../core/Translations";
import {draftBotClient} from "../../core/bot";

declare function sendErrorMessage(user: User, channel: TextChannel, language: string, reason: string, isCancelling?: boolean, interaction?: CommandInteraction): Promise<void>;

declare function getIdFromMention(variable: string): string;

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const userId = getIdFromMention(interaction.options.getString("user")).length < 17
		? interaction.options.getString("user")
		: getIdFromMention(interaction.options.getString("user"));
	const dmModule = Translations.getModule("commands.sendPrivateMessage", language);
	const messageToSend = interaction.options.getString("message") +
		dmModule.format("signature", {
			username: escapeUsername(interaction.user.username)
		});
	const user = draftBotClient.users.cache.get(userId);

	if (userId === undefined) {
		return sendErrorMessage(interaction.user, <TextChannel>interaction.channel, language, dmModule.get("descError"), false, interaction);
	}
	if (user === undefined) {
		return sendErrorMessage(interaction.user, <TextChannel>interaction.channel, language, dmModule.get("personNotExists"), false, interaction);
	}
	const embed = new DraftBotEmbed()
		.formatAuthor(dmModule.get("title"), user)
		.setDescription(messageToSend);
	// TODO trouver un moyen de passer une image dans une slash command
	// .setImage(interaction.attachments.size > 0 ? [...message.attachments.values()][0].url : "");
	try {
		await user.send({content: messageToSend});
		// sendMessageAttachments(message, user);
		return await interaction.reply({embeds: [embed]});
	}
	catch {
		return sendErrorMessage(interaction.user, <TextChannel>interaction.channel, language, dmModule.get("errorCannotSend"), false, interaction);
	}
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("dm")
		.setDescription("Sends a dm to a player (support only)")
		.addStringOption(option => option.setName("user")
			.setDescription("The user you want to send a dm")
			.setRequired(true))
		.addStringOption(option => option.setName("message")
			.setDescription("The message to send")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: null,
		guildPermissions: null,
		guildRequired: null,
		userPermission: Constants.ROLES.USER.SUPPORT
	},
	mainGuildCommand: true,
	slashCommandPermissions: null
};