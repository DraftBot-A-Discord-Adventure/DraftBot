import { ICommand } from "../ICommand";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";

/**
 * Access information about badges
 */
async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(i18n.t("commands:badges.title", {
					lng: interaction.userLanguage
				}))
				.setDescription(i18n.t("commands:badges.description", {
					lng: interaction.userLanguage
				}))
		]
	});
	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("badges"),
	getPacket,
	mainGuildCommand: false
};
