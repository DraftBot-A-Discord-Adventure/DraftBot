import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import { ICommand } from "../ICommand";
import {
	NotificationsConfiguration,
	NotificationsConfigurations
} from "../../database/discord/models/NotificationsConfiguration";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction, ButtonStyle, parseEmoji, StringSelectMenuBuilder,
	StringSelectMenuInteraction, StringSelectMenuOptionBuilder, User
} from "discord.js";
import { Language } from "../../../../Lib/src/Language";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";
import i18n from "../../translations/i18n";
import { NotificationsTypes } from "../../notifications/NotificationType";
import {
	NotificationSendType,
	NotificationSendTypeEnum
} from "../../notifications/NotificationSendType";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { sendInteractionNotForYou } from "../../utils/ErrorUtils";
import { Constants } from "../../../../Lib/src/constants/Constants";
import {
	NotificationsConstantsClass
} from "../../../../Lib/src/constants/NotificationsConstants";

/**
 * Map of the current notification configuration collectors
 *
 * Key: Discord user ID
 * Value: [Date of expiration of the collector, function to stop the collector]
 */
// eslint bug here, it considers that "Date, " is a function name

const currentCollectors = new Map<string, () => void>();

function clearCurrentCollector(userId: string): void {
	const currentCollector = currentCollectors.get(userId);
	if (currentCollector) {
		currentCollector();
	}
}

const forceStopReason = "force";

async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	const notificationsConfiguration = await NotificationsConfigurations.getOrRegister(interaction.user.id);

	await mainPage(interaction, notificationsConfiguration, interaction.userLanguage);

	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("notifications"),
	getPacket,
	mainGuildCommand: false
};


function getNotificationsEmbed(notificationsConfiguration: NotificationsConfiguration, user: User, lng: Language, footer?: string): DraftBotEmbed {
	let description = "";
	NotificationsTypes.ALL.forEach(notificationType => {
		const notificationTypeValue = notificationType.value(notificationsConfiguration);
		const sendLocation = NotificationSendType.toString(notificationTypeValue.sendType, lng, notificationTypeValue.channelId);
		description
			+= `${notificationType.emote} **__${i18n.t(notificationType.i18nKey, { lng })}__**
- **${i18n.t("commands:notifications.enabledField", { lng })}** ${notificationTypeValue.enabled ? DraftBotIcons.collectors.accept : DraftBotIcons.collectors.refuse}`;
		if (notificationTypeValue.enabled) {
			description += `\n- **${i18n.t("commands:notifications.sendLocationField", { lng })}** ${sendLocation}`;
		}
		description += "\n\n";
	});

	const embed = new DraftBotEmbed()
		.formatAuthor(i18n.t("commands:notifications.embedTitle", { lng }), user)
		.setDescription(description);
	if (footer) {
		embed.setFooter({ text: footer });
	}

	return embed;
}

async function mainPage(interaction: DraftbotInteraction | StringSelectMenuInteraction, notificationsConfiguration: NotificationsConfiguration, lng: Language): Promise<void> {
	clearCurrentCollector(interaction.user.id);

	// Build the rows and buttons
	const chooseEnabledCustomId = "chooseEnabled";
	const chooseSendTypeCustomId = "chooseSendType";
	const chooseEnabledEmoji = DraftBotIcons.notifications.bell;
	const chooseSendTypeEmoji = DraftBotIcons.notifications.sendLocation;

	const row = new ActionRowBuilder<ButtonBuilder>();
	row.addComponents(new ButtonBuilder()
		.setEmoji(parseEmoji(chooseEnabledEmoji)!)
		.setCustomId(chooseEnabledCustomId)
		.setLabel(i18n.t("commands:notifications.enableDisable", { lng }))
		.setStyle(ButtonStyle.Secondary));
	const allTypesDisabled = NotificationsTypes.ALL.every(notificationType => !notificationType.value(notificationsConfiguration).enabled);
	if (!allTypesDisabled) {
		row.addComponents(new ButtonBuilder()
			.setEmoji(parseEmoji(chooseSendTypeEmoji)!)
			.setCustomId(chooseSendTypeCustomId)
			.setLabel(i18n.t("commands:notifications.sendLocation", { lng }))
			.setStyle(ButtonStyle.Secondary));
	}

	// Build and send the message
	let reply;
	const embed = getNotificationsEmbed(notificationsConfiguration, interaction.user, lng);
	if (!interaction.isStringSelectMenu()) {
		reply = await interaction.reply({ // Reply is picky on the signature, so the options can't be factorized into a single variable
			embeds: [embed],
			components: [row],
			withResponse: true
		});
	}

	// Click on Buttons/Menu
	else {
		reply = await (interaction as ButtonInteraction | StringSelectMenuInteraction).update({
			embeds: [embed],
			components: [row],
			withResponse: true
		});
	}

	if (!reply?.resource?.message) {
		return;
	}
	const msg = reply.resource.message;

	// Create the collector
	const buttonCollector = msg.createMessageComponentCollector({
		time: Constants.MESSAGES.COLLECTOR_TIME
	});

	buttonCollector.on("collect", async (buttonInteraction: ButtonInteraction) => {
		currentCollectors.set(interaction.user.id, (): void => buttonCollector.stop());
		if (buttonInteraction.user.id !== interaction.user.id) {
			await sendInteractionNotForYou(buttonInteraction.user, buttonInteraction, lng);
			return;
		}

		if (buttonInteraction.customId === chooseEnabledCustomId) {
			buttonCollector.stop(forceStopReason);
			await chooseEnabled(buttonInteraction, notificationsConfiguration, lng);
			return;
		}

		if (buttonInteraction.customId === chooseSendTypeCustomId) {
			buttonCollector.stop(forceStopReason);
			await chooseSendType(buttonInteraction, notificationsConfiguration, lng);
		}
	});

	buttonCollector.on("end", async (_, reason) => {
		currentCollectors.delete(interaction.user.id);

		if (reason !== forceStopReason) {
			await msg.edit({ components: [] });
		}
	});
}

function getSettingsRows(notificationsConfiguration: NotificationsConfiguration, keepOnlyEnabled: boolean, lng: Language): ActionRowBuilder<StringSelectMenuBuilder>[] {
	const notificationsOptions: StringSelectMenuOptionBuilder[] = [];

	NotificationsTypes.ALL.forEach(notificationType => {
		if (keepOnlyEnabled && !notificationType.value(notificationsConfiguration).enabled) {
			return;
		}
		notificationsOptions.push(
			new StringSelectMenuOptionBuilder()
				.setLabel(i18n.t(notificationType.i18nKey, { lng }))
				.setEmoji(parseEmoji(notificationType.emote)!)
				.setValue(notificationType.customId)
		);
	});

	notificationsOptions.push(
		new StringSelectMenuOptionBuilder()
			.setLabel(i18n.t("commands:notifications.back", { lng }))
			.setEmoji(parseEmoji(DraftBotIcons.notifications.back)!)
			.setValue(NotificationsConstantsClass.MENU_IDS.BACK)
	);

	const rowNotificationsSelectionMenu = new StringSelectMenuBuilder()
		.setCustomId(NotificationsConstantsClass.MENU_IDS.NOTIFICATIONS_SELECTION)
		.setPlaceholder(i18n.t("commands:notifications.selectPlaceholder", { lng }))
		.addOptions(notificationsOptions);

	const rowNotifications = new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents(rowNotificationsSelectionMenu);

	return [rowNotifications];
}


async function chooseEnabled(buttonInteraction: ButtonInteraction, notificationsConfiguration: NotificationsConfiguration, lng: Language): Promise<void> {
	clearCurrentCollector(buttonInteraction.user.id);

	// Build the menu
	const menu = getSettingsRows(notificationsConfiguration, false, lng);

	// Build and send the message
	const embed = getNotificationsEmbed(notificationsConfiguration, buttonInteraction.user, lng, i18n.t("commands:notifications.footerEnableDisable", { lng }));
	const msg = await buttonInteraction.update({
		embeds: [embed], components: menu
	});

	// Create the collector
	const menuCollector = msg.createMessageComponentCollector({
		filter: menuInteraction => menuInteraction.customId === NotificationsConstantsClass.MENU_IDS.NOTIFICATIONS_SELECTION,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	currentCollectors.set(buttonInteraction.user.id, (): void => menuCollector.stop());

	menuCollector.on("collect", async (collectorMenuInteraction: StringSelectMenuInteraction) => {
		if (collectorMenuInteraction.user.id !== buttonInteraction.user.id) {
			await sendInteractionNotForYou(collectorMenuInteraction.user, collectorMenuInteraction, lng);
			return;
		}

		if (collectorMenuInteraction.values[0] === NotificationsConstantsClass.MENU_IDS.BACK) {
			menuCollector.stop(forceStopReason);
			await mainPage(collectorMenuInteraction, notificationsConfiguration, lng);
			return;
		}
		const notificationType = NotificationsTypes.ALL.find(notificationType => notificationType.customId === collectorMenuInteraction.values[0]);
		if (notificationType) {
			notificationType.toggleCallback(notificationsConfiguration);
			await notificationsConfiguration.save();
			const embed = getNotificationsEmbed(notificationsConfiguration, collectorMenuInteraction.user, lng, i18n.t("commands:notifications.footerEnableDisable", { lng }));
			await collectorMenuInteraction.update({
				embeds: [embed],
				components: menu
			});
		}
	});

	menuCollector.on("end", async (_, reason) => {
		currentCollectors.delete(buttonInteraction.user.id);

		await notificationsConfiguration.save();

		if (reason !== forceStopReason) {
			await msg.edit({ components: [] });
		}
	});
}

async function chooseSendType(buttonInteraction: ButtonInteraction, notificationsConfiguration: NotificationsConfiguration, lng: Language): Promise<void> {
	clearCurrentCollector(buttonInteraction.user.id);

	// Build the menu
	const menu = getSettingsRows(notificationsConfiguration, false, lng);

	// Build and send the message
	const embed = getNotificationsEmbed(notificationsConfiguration, buttonInteraction.user, lng, i18n.t("commands:notifications.footerSendLocation", { lng }));
	const msg = await buttonInteraction.update({
		embeds: [embed], components: menu
	});

	// Create the collector
	const menuCollector = msg.createMessageComponentCollector({
		filter: menuInteraction => menuInteraction.customId === NotificationsConstantsClass.MENU_IDS.NOTIFICATIONS_SELECTION,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	currentCollectors.set(buttonInteraction.user.id, (): void => menuCollector.stop());

	menuCollector.on("collect", async (collectorMenuInteraction: StringSelectMenuInteraction) => {
		if (buttonInteraction.user.id !== collectorMenuInteraction.user.id) {
			await sendInteractionNotForYou(collectorMenuInteraction.user, collectorMenuInteraction, lng);
			return;
		}

		if (collectorMenuInteraction.values[0] === NotificationsConstantsClass.MENU_IDS.BACK) {
			menuCollector.stop(forceStopReason);
			await mainPage(collectorMenuInteraction, notificationsConfiguration, lng);
			return;
		}

		const notificationType = NotificationsTypes.ALL.find(notificationType => notificationType.customId === collectorMenuInteraction.values[0]);
		if (notificationType) {
			notificationType.changeSendTypeCallback(
				notificationsConfiguration,
				(notificationType.value(notificationsConfiguration).sendType + 1) % (Object.keys(NotificationSendTypeEnum).length / 2),
				buttonInteraction.channel!.id
			);
			await notificationsConfiguration.save();

			const embed = getNotificationsEmbed(notificationsConfiguration, collectorMenuInteraction.user, lng, i18n.t("commands:notifications.footerSendLocation", { lng }));
			await collectorMenuInteraction.update({
				embeds: [embed],
				components: menu
			});
		}
	});

	menuCollector.on("end", async (_, reason) => {
		currentCollectors.delete(buttonInteraction.user.id);
		await notificationsConfiguration.save();

		if (reason !== forceStopReason) {
			await msg.edit({ components: [] });
		}
	});
}
