import { ICommand } from "../ICommand";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import {
	NotificationsConfiguration,
	NotificationsConfigurations
} from "../../database/discord/models/NotificationsConfiguration";
import {
	ActionRowBuilder,
	ButtonBuilder, ButtonInteraction,
	ButtonStyle,
	parseEmoji,
	StringSelectMenuBuilder, StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
	User
} from "discord.js";
import { Constants } from "../../../../Lib/src/constants/Constants";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";
import i18n from "../../translations/i18n";
import { Language } from "../../../../Lib/src/Language";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { sendInteractionNotForYou } from "../../utils/ErrorUtils";
import {
	NotificationSendType, NotificationSendTypeEnum
} from "../../notifications/NotificationSendType";
import { NotificationsTypes } from "../../notifications/NotificationType";

/**
 * Map of the current notification configuration collectors
 *
 * Key: Discord user ID
 * Value: [Date of expiration of the collector, function to stop the collector]
 */
// eslint bug here, it considers that "Date, " is a function name

const currentCollectors = new Map<string, () => void>();


const backButtonCustomId = "back";
const forceStopReason = "force";

async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	const notificationsConfiguration = await NotificationsConfigurations.getOrRegister(interaction.user.id);

	await mainPage(interaction, notificationsConfiguration, interaction.userLanguage);

	return null;
}

function clearCurrentCollector(userId: string): void {
	const currentCollector = currentCollectors.get(userId);
	if (currentCollector) {
		currentCollector();
	}
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
	if (!interaction.isButton() && !interaction.isStringSelectMenu()) {
		reply = await interaction.reply({ // Reply is picky on the signature, so the options can't be factorized into a single variable
			embeds: [embed],
			components: [row],
			withResponse: true
		});
	}
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
	const MenuCollector = msg.createMessageComponentCollector({
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	currentCollectors.set(interaction.user.id, (): void => MenuCollector.stop());

	MenuCollector.on("collect", async (menuInteraction: StringSelectMenuInteraction) => {
		if (menuInteraction.user.id !== interaction.user.id) {
			await sendInteractionNotForYou(menuInteraction.user, menuInteraction, lng);
			return;
		}

		if (menuInteraction.customId === chooseEnabledCustomId) {
			MenuCollector.stop(forceStopReason);
			await chooseEnabled(menuInteraction, notificationsConfiguration, lng);
			return;
		}

		if (menuInteraction.customId === chooseSendTypeCustomId) {
			MenuCollector.stop(forceStopReason);
			await chooseSendType(menuInteraction, notificationsConfiguration, lng);
		}
	});

	MenuCollector.on("end", async (_, reason) => {
		currentCollectors.delete(interaction.user.id);

		if (reason !== forceStopReason) {
			await msg.edit({ components: [] });
		}
	});
}

function getSettingsSelectMenu(
	notificationsConfiguration: NotificationsConfiguration,
	keepOnlyEnabled: boolean,
	lng: Language,
	customId: string,
	includeBack = true
): ActionRowBuilder<StringSelectMenuBuilder> {
	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId(customId)
		.setPlaceholder(i18n.t("commands:notifications.selectPlaceholder", { lng }));

	for (const notificationType of NotificationsTypes.ALL) {
		if (keepOnlyEnabled && !notificationType.value(notificationsConfiguration).enabled) {
			continue;
		}

		selectMenu.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(i18n.t(notificationType.i18nKey, { lng }))
			.setEmoji(parseEmoji(notificationType.emote)!)
			.setValue(notificationType.customId));
	}

	if (includeBack) {
		selectMenu.addOptions(new StringSelectMenuOptionBuilder()
			.setLabel(i18n.t("commands:notifications.back", { lng }))
			.setEmoji(parseEmoji(DraftBotIcons.notifications.back)!)
			.setValue(backButtonCustomId));
	}

	return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
}


async function chooseEnabled(interaction: StringSelectMenuInteraction, notificationsConfiguration: NotificationsConfiguration, lng: Language): Promise<void> {
	clearCurrentCollector(interaction.user.id);

	const row = getSettingsSelectMenu(notificationsConfiguration, false, lng, "enableNotificationsMenu");

	const embed = getNotificationsEmbed(notificationsConfiguration, interaction.user, lng, i18n.t("commands:notifications.footerEnableDisable", { lng }));
	const msg = await interaction.update({
		embeds: [embed],
		components: [row],
		withResponse: true
	});

	const menuCollector = msg.resource!.message!.createMessageComponentCollector({
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	currentCollectors.set(interaction.user.id, (): void => menuCollector.stop());

	menuCollector.on("collect", async (menuInteraction: StringSelectMenuInteraction) => {
		if (menuInteraction.user.id !== interaction.user.id) {
			await sendInteractionNotForYou(menuInteraction.user, menuInteraction, lng);
			return;
		}

		await menuInteraction.deferUpdate();

		if (menuInteraction.values[0] === backButtonCustomId) {
			menuCollector.stop(forceStopReason);
			await mainPage(menuInteraction, notificationsConfiguration, lng);
			return;
		}


		const notificationType = NotificationsTypes.ALL.find(nt => nt.customId === menuInteraction.values[0]);
		if (notificationType) {
			notificationType.toggleCallback(notificationsConfiguration);
			await notificationsConfiguration.save();

			const updatedEmbed = getNotificationsEmbed(notificationsConfiguration, menuInteraction.user, lng, i18n.t("commands:notifications.footerEnableDisable", { lng }));
			await menuInteraction.editReply({
				embeds: [updatedEmbed],
				components: [row]
			});
		}
	});

	menuCollector.on("end", async (_, reason) => {
		currentCollectors.delete(interaction.user.id);
		await notificationsConfiguration.save();

		if (reason !== forceStopReason) {
			await msg.resource!.message!.edit({ components: [] });
		}
	});
}


async function chooseSendType(interaction: StringSelectMenuInteraction, notificationsConfiguration: NotificationsConfiguration, lng: Language): Promise<void> {
	clearCurrentCollector(interaction.user.id);

	const row = getSettingsSelectMenu(notificationsConfiguration, true, lng, "sendTypeNotificationsMenu");

	const embed = getNotificationsEmbed(notificationsConfiguration, interaction.user, lng, i18n.t("commands:notifications.footerSendLocation", { lng }));
	const msg = await interaction.update({
		embeds: [embed],
		components: [row],
		withResponse: true
	});

	const menuCollector = msg.resource!.message!.createMessageComponentCollector({
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	currentCollectors.set(interaction.user.id, (): void => menuCollector.stop());

	menuCollector.on("collect", async (menuInteraction: StringSelectMenuInteraction) => {
		if (menuInteraction.user.id !== interaction.user.id) {
			await sendInteractionNotForYou(menuInteraction.user, menuInteraction, lng);
			return;
		}

		await menuInteraction.deferUpdate();

		if (menuInteraction.values[0] === backButtonCustomId) {
			menuCollector.stop(forceStopReason);
			await mainPage(menuInteraction, notificationsConfiguration, lng);
			return;
		}


		const notificationType = NotificationsTypes.ALL.find(nt => nt.customId === menuInteraction.values[0]);
		if (notificationType) {
			notificationType.changeSendTypeCallback(
				notificationsConfiguration,
				(notificationType.value(notificationsConfiguration).sendType + 1) % (Object.keys(NotificationSendTypeEnum).length / 2),
				interaction.channel!.id
			);
			await notificationsConfiguration.save();

			const updatedEmbed = getNotificationsEmbed(notificationsConfiguration, menuInteraction.user, lng, i18n.t("commands:notifications.footerSendLocation", { lng }));
			await menuInteraction.editReply({
				embeds: [updatedEmbed],
				components: [row]
			});
		}
	});

	menuCollector.on("end", async (_, reason) => {
		currentCollectors.delete(interaction.user.id);
		await notificationsConfiguration.save();

		if (reason !== forceStopReason) {
			await msg.resource!.message!.edit({ components: [] });
		}
	});
}


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

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("notifications"),
	getPacket,
	mainGuildCommand: false
};
