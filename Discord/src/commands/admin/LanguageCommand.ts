import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} from "discord.js";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {StringConstants} from "../../../../Lib/src/constants/StringConstants";
import {PermissionsConstants} from "../../constants/PermissionsConstants";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";

/**
 * Allow an admin to change the prefix the bot uses in a specific server
 */
async function getPacket(interaction: DraftbotInteraction, keycloakUser: KeycloakUser): Promise<null> {
	const selectLanguageMenuId = "languageSelectionMenu";
	const selectLanguageMenuOptions = Object.keys(StringConstants.LANGUAGE)
		.map((key) => {
			const languageCode = StringConstants.LANGUAGE[key as keyof typeof StringConstants.LANGUAGE];
			return new StringSelectMenuOptionBuilder()
				.setLabel(i18n.t(`commands:language.languages.${languageCode}.name`, {lng: KeycloakUtils.getUserLanguage(keycloakUser)}))
				.setEmoji(i18n.t(`commands:language.languages.${languageCode}.emoji`, {lng: KeycloakUtils.getUserLanguage(keycloakUser)}))
				.setValue(languageCode);
		});
	const languageSelectionMenu = new StringSelectMenuBuilder()
		.setCustomId(selectLanguageMenuId)
		.setPlaceholder(i18n.t("commands:language.selectLanguage", {lng: KeycloakUtils.getUserLanguage(keycloakUser)}))
		.addOptions(selectLanguageMenuOptions);
	const row = new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents(languageSelectionMenu);
	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.setTitle(i18n.t("commands:language.title", {
				lng: KeycloakUtils.getUserLanguage(keycloakUser)
			}))
			.setDescription(i18n.t("commands:language.description", {
				lng: KeycloakUtils.getUserLanguage(keycloakUser)
			}))],
		components: [row]
	});
	await KeycloakUtils.updateUserLanguage(keycloakConfig, keycloakUser, StringConstants.LANGUAGE.ENGLISH);
	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("language"),
	getPacket,
	requirements: {
		userPermission: PermissionsConstants.ROLES.USER.ADMINISTRATOR
	},
	mainGuildCommand: false
};
