import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} from "discord.js";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import { StringConstants } from "../../../../Lib/src/constants/StringConstants";
/**
 * Allow an admin to change the prefix the bot uses in a specific server
 */
async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	const selectLanguageMenuId = "languageSelectionMenu";

	const selectLanguageMenuOptions = Object.keys(StringConstants.LANGUAGE).map((key) => {
		const languageCode = StringConstants.LANGUAGE[key as keyof typeof StringConstants.LANGUAGE];
		return new StringSelectMenuOptionBuilder()
			.setLabel(i18n.t(`commands:language.languages.${languageCode}.name` , {lng: interaction.channel.language}))
			.setEmoji(i18n.t(`commands:language.languages.${languageCode}.emoji` , {lng: interaction.channel.language}))
			.setValue(languageCode);
	});
	const languageSelectionMenu = new StringSelectMenuBuilder()
		.setCustomId(selectLanguageMenuId)
		.setPlaceholder(i18n.t("commands:language.selectLanguage", {lng: interaction.channel.language}))
		.addOptions(selectLanguageMenuOptions);
	const row = new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents(languageSelectionMenu);
	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.setTitle(i18n.t("commands:language.title", {
				lng: interaction.channel.language
			}))
			.setDescription(i18n.t("commands:language.description", {
				lng: interaction.channel.language
			}))],
		components: [row]
	});
	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("language"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};
