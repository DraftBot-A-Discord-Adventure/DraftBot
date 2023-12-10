import {User} from "discord.js";
import {DraftBotErrorEmbed} from "../messages/DraftBotErrorEmbed";
import {Language} from "../../../Lib/src/Language";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";

/**
 * Reply to an interaction with a given error
 * @param interaction
 * @param language
 * @param reason
 */
export async function replyErrorMessage(interaction: DraftbotInteraction, language: Language, reason: string): Promise<void> {
	await interaction.reply({
		embeds: [new DraftBotErrorEmbed(interaction.user, interaction, language, reason)],
		ephemeral: true
	});
}

/**
 * Sends an error message
 * @param user
 * @param interaction
 * @param language
 * @param reason
 * @param isCancelling - true if the error is a cancelling error
 * @param isBlockedError - set to false if you don't want the "this user is blocked" message when selecting a different user than the one who invoked the command
 */
export async function sendErrorMessage(
	user: User,
	interaction: DraftbotInteraction,
	language: Language,
	reason: string,
	isCancelling = false,
	isBlockedError = true
): Promise<void> {
	await interaction.channel.send({
		embeds: [new DraftBotErrorEmbed(user, interaction, language, reason, isCancelling, isBlockedError)]
	});
}