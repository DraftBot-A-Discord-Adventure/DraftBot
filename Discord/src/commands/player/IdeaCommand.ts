import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { ICommand } from "../ICommand";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";

async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(i18n.t("commands:idea.title", {
					lng: interaction.userLanguage
				}))
				.setDescription(i18n.t("commands:idea.description", {
					lng: interaction.userLanguage
				}))
		]
	});
	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("idea"),
	getPacket,
	mainGuildCommand: false
};
