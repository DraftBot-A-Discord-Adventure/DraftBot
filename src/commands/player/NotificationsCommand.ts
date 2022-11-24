import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import Player from "../../core/database/game/models/Player";
import {SlashCommandBuilder} from "@discordjs/builders";
import {NotificationsConstants} from "../../core/constants/NotificationsConstants";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";


/**
 * Activate or deactivate notifications.
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param player
 */
async function executeCommand(interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const choice = interaction.options.get("mode").value;
	const translations = Translations.getModule("commands.notifications", language);
	const notificationsEmbed = new DraftBotEmbed()
		.formatAuthor(translations.get("title"), interaction.user)
		.setDescription(translations.get(`description.${choice}`));

	switch (choice) {
	case NotificationsConstants.CHANNEL_SCOPE:
		player.notifications = interaction.channelId;
		notificationsEmbed.setDescription(`${notificationsEmbed.data.description}\n\n${translations.get("normal")}`);
		break;
	case NotificationsConstants.DM_SCOPE:
		player.notifications = NotificationsConstants.DM_VALUE;
		await player.sendNotificationToPlayer(new DraftBotEmbed()
			.formatAuthor(translations.get("title"), interaction.user)
			.setDescription(translations.get("normal")), language);
		break;
	case NotificationsConstants.NO_NOTIFICATION_SCOPE:
		player.notifications = NotificationsConstants.NO_NOTIFICATION;
		notificationsEmbed.setDescription(`${notificationsEmbed.data.description}`);
		break;
	default:
		return;
	}
	await interaction.reply({embeds: [notificationsEmbed], ephemeral: choice !== NotificationsConstants.CHANNEL_SCOPE});
	await player.save();
}

const currentCommandFrenchTranslations = Translations.getModule("commands.notifications", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.notifications", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionScopeName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionScopeName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionScopeDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionScopeDescription")
			})
			.addChoices(
				{
					name: currentCommandEnglishTranslations.get("scopes.dm"),
					"name_localizations":
						{
							fr: currentCommandFrenchTranslations.get("scopes.dm")
						}
					,
					value: NotificationsConstants.DM_SCOPE
				},
				{
					name: currentCommandEnglishTranslations.get("scopes.channel"),
					"name_localizations":
						{
							fr: currentCommandFrenchTranslations.get("scopes.channel")
						}
					,
					value: NotificationsConstants.CHANNEL_SCOPE
				},
				{
					name: currentCommandEnglishTranslations.get("scopes.none"),
					"name_localizations":
						{
							fr: currentCommandFrenchTranslations.get("scopes.none")
						}
					,
					value: NotificationsConstants.NO_NOTIFICATION_SCOPE
				}
			)
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};