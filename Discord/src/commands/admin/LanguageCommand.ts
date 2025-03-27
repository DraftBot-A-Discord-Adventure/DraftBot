import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder} from "discord.js";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {Constants} from "../../../../Lib/src/constants/Constants";
import {sendInteractionNotForYou} from "../../utils/ErrorUtils";
import {LANGUAGE, Language} from "../../../../Lib/src/Language";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";

/**
 * Change the language used by the bot to interact with the player
 */
async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<null> {
	const selectLanguageMenuId = "languageSelectionMenu";
	const lng = interaction.userLanguage;

	const selectLanguageMenuOptions = LANGUAGE.LANGUAGES
		.map((languageCode) => new StringSelectMenuOptionBuilder()
			.setLabel(i18n.t(`commands:language.languages.${languageCode}`, {lng}))
			.setEmoji(DraftBotIcons.languages[languageCode])
			.setValue(languageCode));

	const languageSelectionMenu = new StringSelectMenuBuilder()
		.setCustomId(selectLanguageMenuId)
		.setPlaceholder(i18n.t("commands:language.selectLanguage", {lng}))
		.addOptions(selectLanguageMenuOptions);

	const row = new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents(languageSelectionMenu);

	const msg = await interaction.reply({
		embeds: [new DraftBotEmbed()
			.setTitle(i18n.t("commands:language.title", {lng}))
			.setDescription(i18n.t("commands:language.description", {lng}))],
		components: [row]
	});

	const collector = msg.createMessageComponentCollector({
		filter: menuInteraction => menuInteraction.customId === selectLanguageMenuId,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});

	collector.on("collect", async (menuInteraction: StringSelectMenuInteraction) => {

		if (menuInteraction.user.id !== interaction.user.id) {
			await sendInteractionNotForYou(menuInteraction.user, menuInteraction, lng);
			return;
		}

		await KeycloakUtils.updateUserLanguage(keycloakConfig, keycloakUser, menuInteraction.values[0] as Language);

		await menuInteraction.reply({
			embeds: [new DraftBotEmbed()
				.setTitle(i18n.t("commands:language.newLanguageSetTitle", {
					lng: menuInteraction.values[0] as Language
				}))
				.setDescription(i18n.t("commands:language.newLanguageSetDescription", {
					lng: menuInteraction.values[0] as Language
				}))]
		});

		collector.stop();
	});

	collector.on("end", async () => {
		await msg.edit({
			components: []
		});
	});

	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("language"),
	getPacket,
	mainGuildCommand: false
};
