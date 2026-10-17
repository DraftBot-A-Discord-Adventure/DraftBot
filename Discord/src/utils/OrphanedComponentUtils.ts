import {
	ActionRow,
	ActionRowBuilder,
	ComponentType,
	MessageActionRowComponent,
	MessageActionRowComponentBuilder,
	MessageComponentInteraction,
	TopLevelComponent
} from "discord.js";
import { MessageFlags } from "discord-api-types/v10";
import { CrowniclesEmbed } from "../messages/CrowniclesEmbed";
import i18n from "../translations/i18n";
import { LANGUAGE } from "../../../Lib/src/Language";
import { escapeUsername } from "../../../Lib/src/utils/StringUtils";
import { CrowniclesLogger } from "../../../Lib/src/logs/CrowniclesLogger";
import { DiscordConstants } from "../DiscordConstants";
import { disableRows } from "./DiscordCollectorUtils";

/**
 * Collectors only live in the memory of the shard process that sent their message: the components of a message
 * sent before this process started are not listened to anymore (redeployment, crash), so nothing would answer them
 * and Discord would only show that the application did not respond (#4968).
 */
export function isOrphanedComponentInteraction(interaction: MessageComponentInteraction): boolean {
	return interaction.message.createdTimestamp < performance.timeOrigin - DiscordConstants.ORPHANED_COMPONENT_CLOCK_MARGIN_MS;
}

function isActionRow(component: TopLevelComponent): component is ActionRow<MessageActionRowComponent> {
	return component.type === ComponentType.ActionRow;
}

/**
 * Disabled copy of the message rows, or null when the message holds other layouts that cannot be rebuilt safely
 */
function getDisabledRows(interaction: MessageComponentInteraction): ActionRowBuilder<MessageActionRowComponentBuilder>[] | null {
	const components = interaction.message.components;
	if (!components.every(isActionRow)) {
		return null;
	}
	const rows = components.map(row => ActionRowBuilder.from<MessageActionRowComponentBuilder>(row));
	disableRows(rows);
	return rows;
}

/**
 * Tell the player that the menu has expired and disable its components, instead of letting the interaction fail
 */
export async function replyToOrphanedComponentInteraction(interaction: MessageComponentInteraction): Promise<void> {
	const lng = LANGUAGE.fromLocale(interaction.locale);
	const embed = new CrowniclesEmbed()
		.formatAuthor(i18n.t("error:titleDidntWork", {
			lng,
			pseudo: escapeUsername(interaction.user.displayName)
		}), interaction.user)
		.setDescription(i18n.t("error:interactionExpired", { lng }))
		.setErrorColor();

	try {
		const disabledRows = getDisabledRows(interaction);
		if (disabledRows) {
			await interaction.update({ components: disabledRows });
			await interaction.followUp({
				embeds: [embed],
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		await interaction.reply({
			embeds: [embed],
			flags: MessageFlags.Ephemeral
		});
	}
	catch (error) {
		CrowniclesLogger.errorWithObj("Unable to answer a component of a message sent before the shard started", error);
	}
}
