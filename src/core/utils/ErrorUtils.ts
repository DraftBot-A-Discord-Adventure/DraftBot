import {DraftBotErrorEmbed} from "../messages/DraftBotErrorEmbed";
import {CommandInteraction, TextBasedChannel, User} from "discord.js";

export function sendErrorMessage(user: User, channel: TextBasedChannel, language: string, reason: string, isCancelling = false, interaction: CommandInteraction = null) {
	if (interaction) {
		if (isCancelling) {
			return interaction.reply({embeds: [new DraftBotErrorEmbed(user, language, reason, true)]});
		}
		return interaction.reply({embeds: [new DraftBotErrorEmbed(user, language, reason, false)], ephemeral: true});
	}
	return channel.send({embeds: [new DraftBotErrorEmbed(user, language, reason, isCancelling)]});
}