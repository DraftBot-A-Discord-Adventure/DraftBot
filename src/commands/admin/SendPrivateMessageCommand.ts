import {escapeUsername, getIdFromMention} from "../../core/utils/StringUtils";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {draftBotClient} from "../../core/bot";
import {replyErrorMessage} from "../../core/utils/ErrorUtils";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Allow an admin to change the prefix the bot use in a specific server
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const userId = getIdFromMention(interaction.options.get("user").value as string).length < 17
		? interaction.options.get("user").value as string
		: getIdFromMention(interaction.options.get("user").value as string);
	const dmModule = Translations.getModule("commands.sendPrivateMessage", language);
	const messageToSend = interaction.options.get("message").value as string +
		dmModule.format("signature", {
			username: escapeUsername(interaction.user.username)
		});
	const user = draftBotClient.users.cache.get(userId);

	if (!userId) {
		await replyErrorMessage(interaction, language, dmModule.get("descError"));
		return;
	}
	if (!user) {
		await replyErrorMessage(interaction, language, dmModule.get("personNotExists"));
		return;
	}
	const embed = new DraftBotEmbed()
		.formatAuthor(dmModule.get("title"), user)
		.setDescription(messageToSend);
	// TODO trouver un moyen de passer une image dans une slash command
	// .setImage(interaction.attachments.size > 0 ? [...message.attachments.values()][0].url : "");
	try {
		await user.send({content: messageToSend});
		// sendMessageAttachments(message, user);
		await interaction.reply({embeds: [embed]});
	}
	catch {
		await replyErrorMessage(interaction, language, dmModule.get("errorCannotSend"));
	}
}

const currentCommandFrenchTranslations = Translations.getModule("commands.sendPrivateMessage", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.sendPrivateMessage", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionUserName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionUserDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionUserDescription")
			})
			.setRequired(true))
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionMessageName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionMessageName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionMessageDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionMessageDescription")
			})
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};