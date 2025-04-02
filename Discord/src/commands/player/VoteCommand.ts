import { ICommand } from "../ICommand";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";

/**
 * Shows the embed that redirects to the topGG vote page
 */
async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(i18n.t("commands:vote.title", {
					lng: interaction.userLanguage
				}))
				.setDescription(i18n.t("commands:vote.description", {
					lng: interaction.userLanguage
				}))
		]
	});
	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("vote"),
	getPacket,
	mainGuildCommand: false
};
