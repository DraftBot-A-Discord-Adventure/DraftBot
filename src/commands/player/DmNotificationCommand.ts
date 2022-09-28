import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/database/game/models/Entity";
import {escapeUsername} from "../../core/utils/StringUtils";
import {ICommand} from "../ICommand";
import {CommandInteraction} from "discord.js";
import {Translations} from "../../core/Translations";
import {sendBlockedError} from "../../core/utils/BlockingUtils";
import {EffectsConstants} from "../../core/constants/EffectsConstants";
import {Constants} from "../../core/Constants";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";

/**
 * Activate or deactivate DMs notifications.
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedError(interaction, language)) {
		return;
	}
	const translationsDmn = Translations.getModule("commands.dmNotification", language);
	// update value user dmNotification
	entity.Player.dmNotification = !entity.Player.dmNotification;
	const isDmNotificationOn = entity.Player.dmNotification;
	// send message updated value
	const dmNotificationEmbed = new DraftBotEmbed()
		.setDescription(
			translationsDmn.format("normal", {
				pseudo: escapeUsername(interaction.user.username),
				notifOnVerif: isDmNotificationOn ? translationsDmn.get("open") : translationsDmn.get("closed")
			})
		)
		.formatAuthor(translationsDmn.get("title"), interaction.user);
	if (isDmNotificationOn) {
		try {
			await interaction.user.send({embeds: [dmNotificationEmbed]});
			await interaction.reply({embeds: [dmNotificationEmbed], ephemeral: true});
		}
		catch (err) {
			entity.Player.dmNotification = false;
			await sendBlockedError(interaction, language);
		}

	}
	else {
		await interaction.reply({embeds: [dmNotificationEmbed], ephemeral: true});
	}
	await entity.Player.save();
}

const currentCommandFrenchTranslations = Translations.getModule("commands.dmNotification", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.dmNotification", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations),
	executeCommand,
	requirements: {
		disallowEffects: [EffectsConstants.EMOJI_TEXT.BABY, EffectsConstants.EMOJI_TEXT.DEAD]
	},
	mainGuildCommand: false
};