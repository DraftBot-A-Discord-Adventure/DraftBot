import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { ICommand } from "../ICommand";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";

async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	const lng = interaction.userLanguage;
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setTitle(i18n.t("commands:idea.title", { lng }))
				.setDescription(i18n.t("commands:idea.description", { lng }))
		]
	});
	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("idea"),
	getPacket,
	mainGuildCommand: false
};
