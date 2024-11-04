import {ICommand} from "../ICommand";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {
	NotificationsConfiguration,
	NotificationsConfigurations
} from "../../database/discord/models/NotificationsConfiguration";
import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, parseEmoji} from "discord.js";
import { Constants } from "../../../../Lib/src/constants/Constants";
import {NotificationSendType} from "../../notifications/NotificationSendType";

/**
 * Map of the current notification configuration collectors
 *
 * Key: Discord user ID
 * Value: [Date of expiration of the collector, function to stop the collector]
 */
// eslint bug here, it considers that "Date, " is a function name
// eslint-disable-next-line func-call-spacing
const currentCollectors = new Map<string, [Date, () => void]>();

type NotificationConfigurationCheckBox = {
	emote: string,
	customId: string,
	name: string,
	value: (notificationsConfiguration: NotificationsConfiguration) => {
		enabled: boolean,
		sendType: NotificationSendType,
		channelId?: string
	},
	toggleCallback: (notificationsConfiguration: NotificationsConfiguration) => void;
	changeSendTypeCallback: (notificationsConfiguration: NotificationsConfiguration, sendType: NotificationSendType, channelId: string) => void;
}

const checkBoxes: NotificationConfigurationCheckBox[] = [
	{
		emote: "📰",
		customId: "report",
		name: "Report notifications",
		value: (notificationsConfiguration) => ({
			enabled: notificationsConfiguration.reportEnabled,
			sendType: notificationsConfiguration.reportSendType,
			channelId: notificationsConfiguration.reportChannelId
		}),
		toggleCallback: (notificationsConfiguration): void => {
			notificationsConfiguration.reportEnabled = !notificationsConfiguration.reportEnabled;
		},
		changeSendTypeCallback: (notificationsConfiguration, sendType, channelId): void => {
			notificationsConfiguration.reportSendType = sendType;
			notificationsConfiguration.reportChannelId = channelId;
		}
	},
	{
		emote: "🏟️",
		customId: "guildDaily",
		name: "Guild daily notifications",
		value: (notificationsConfiguration) => ({
			enabled: notificationsConfiguration.guildDailyEnabled,
			sendType: notificationsConfiguration.guildDailySendType,
			channelId: notificationsConfiguration.guildDailyChannelId
		}),
		toggleCallback: (notificationsConfiguration): void => {
			notificationsConfiguration.guildDailyEnabled = !notificationsConfiguration.guildDailyEnabled;
		},
		changeSendTypeCallback: (notificationsConfiguration, sendType, channelId): void => {
			notificationsConfiguration.guildDailySendType = sendType;
			notificationsConfiguration.guildDailyChannelId = channelId;
		}
	}
];

async function getPacket(interaction: DraftbotInteraction): Promise<null> {
	const notificationsConfiguration = await NotificationsConfigurations.getOrRegister(interaction.user.id);

	await mainPage(interaction, notificationsConfiguration, false);

	return null;
}

async function mainPage(interaction: DraftbotInteraction | ButtonInteraction, notificationsConfiguration: NotificationsConfiguration, isButtonInteraction: boolean): Promise<void> {
	const currentCollector = currentCollectors.get(interaction.user.id);
	if (currentCollector) {
		currentCollector[1]();
	}

	const description = getNotificationsEmbedDescription(notificationsConfiguration);

	const chooseEnabledCustomId = "chooseEnabled";
	const chooseSendTypeCustomId = "chooseSendType";
	const chooseEnabledEmoji = "🔔";
	const chooseSendTypeEmoji = "📩";

	const row = new ActionRowBuilder<ButtonBuilder>();
	row.addComponents(new ButtonBuilder()
		.setEmoji(parseEmoji(chooseEnabledEmoji)!)
		.setCustomId(chooseEnabledCustomId)
		.setStyle(ButtonStyle.Secondary));
	row.addComponents(new ButtonBuilder()
		.setEmoji(parseEmoji(chooseSendTypeEmoji)!)
		.setCustomId(chooseSendTypeCustomId)
		.setStyle(ButtonStyle.Secondary));

	let msg;
	const msgOption = {
		embeds: [{
			title: "Notifications configuration",
			description,
			footer: { text: `${chooseEnabledEmoji}: Enable or disable / ${chooseSendTypeEmoji}: Send location` }
		}],
		components: [row]
	};
	if (!isButtonInteraction) {
		msg = await interaction.reply(msgOption);
	}
	else {
		msg = await (interaction as ButtonInteraction).update(msgOption);
	}

	const buttonCollector = msg.createMessageComponentCollector({
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	currentCollectors.set(interaction.user.id, [new Date(Date.now() + Constants.MESSAGES.COLLECTOR_TIME), (): void => buttonCollector.stop()]);

	buttonCollector.on("collect", async (buttonInteraction: ButtonInteraction) => {
		if (buttonInteraction.customId === chooseEnabledCustomId) {
			buttonCollector.stop();
			await chooseEnabled(buttonInteraction, notificationsConfiguration);
			return;
		}

		if (buttonInteraction.customId === chooseSendTypeCustomId) {
			buttonCollector.stop();
			await chooseSendType(buttonInteraction, notificationsConfiguration);
		}
	});

	buttonCollector.on("end", () => {
		currentCollectors.delete(interaction.user.id);
	});
}

async function chooseEnabled(buttonInteraction: ButtonInteraction, notificationsConfiguration: NotificationsConfiguration): Promise<void> {
	const currentCollector = currentCollectors.get(buttonInteraction.user.id);
	if (currentCollector) {
		currentCollector[1]();
	}

	const description = getNotificationsEmbedDescription(notificationsConfiguration);

	const row = new ActionRowBuilder<ButtonBuilder>();
	const backCustomId = "back";
	checkBoxes.forEach(checkBox => {
		row.addComponents(new ButtonBuilder()
			.setEmoji(parseEmoji(checkBox.emote)!)
			.setCustomId(checkBox.customId)
			.setStyle(ButtonStyle.Secondary));
	});
	row.addComponents(new ButtonBuilder()
		.setEmoji(parseEmoji("↩️")!)
		.setCustomId(backCustomId)
		.setStyle(ButtonStyle.Secondary));

	const msgOption = {
		embeds: [{
			title: "Notifications configuration",
			description,
			footer: { text: "Click on the buttons below to toggle the notifications" }
		}],
		components: [row]
	};
	const msg = await buttonInteraction.update(msgOption);

	const buttonCollector = msg.createMessageComponentCollector({
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	currentCollectors.set(buttonInteraction.user.id, [new Date(Date.now() + Constants.MESSAGES.COLLECTOR_TIME), (): void => buttonCollector.stop()]);

	buttonCollector.on("collect", async (buttonInteraction: ButtonInteraction) => {
		if (buttonInteraction.customId === backCustomId) {
			buttonCollector.stop();
			await mainPage(buttonInteraction, notificationsConfiguration, true);
			return;
		}

		const checkBox = checkBoxes.find(checkBox => checkBox.customId === buttonInteraction.customId);
		if (checkBox) {
			checkBox.toggleCallback(notificationsConfiguration);
			await buttonInteraction.update({
				embeds: [{
					title: "Notifications configuration",
					description: getNotificationsEmbedDescription(notificationsConfiguration),
					footer: {text: "Click on the buttons below to toggle the notifications"}
				}],
				components: [row]
			});
		}
	});

	buttonCollector.on("end", async () => {
		currentCollectors.delete(buttonInteraction.user.id);
		await notificationsConfiguration.save();
	});
}

async function chooseSendType(buttonInteraction: ButtonInteraction, notificationsConfiguration: NotificationsConfiguration): Promise<void> {
	const currentCollector = currentCollectors.get(buttonInteraction.user.id);
	if (currentCollector) {
		currentCollector[1]();
	}

	const description = getNotificationsEmbedDescription(notificationsConfiguration);

	const row = new ActionRowBuilder<ButtonBuilder>();
	const backCustomId = "back";
	checkBoxes.forEach(checkBox => {
		row.addComponents(new ButtonBuilder()
			.setEmoji(parseEmoji(checkBox.emote)!)
			.setCustomId(checkBox.customId)
			.setStyle(ButtonStyle.Secondary));
	});
	row.addComponents(new ButtonBuilder()
		.setEmoji(parseEmoji("↩️")!)
		.setCustomId(backCustomId)
		.setStyle(ButtonStyle.Secondary));

	const msgOption = {
		embeds: [{
			title: "Notifications configuration",
			description,
			footer: { text: "Click on the buttons below to change the send location" }
		}],
		components: [row]
	};
	const msg = await buttonInteraction.update(msgOption);

	const buttonCollector = msg.createMessageComponentCollector({
		time: Constants.MESSAGES.COLLECTOR_TIME
	});
	currentCollectors.set(buttonInteraction.user.id, [new Date(Date.now() + Constants.MESSAGES.COLLECTOR_TIME), (): void => buttonCollector.stop()]);

	buttonCollector.on("collect", async (buttonInteraction: ButtonInteraction) => {
		if (buttonInteraction.customId === backCustomId) {
			buttonCollector.stop();
			await mainPage(buttonInteraction, notificationsConfiguration, true);
			return;
		}

		const checkBox = checkBoxes.find(checkBox => checkBox.customId === buttonInteraction.customId);
		if (checkBox) {
			checkBox.changeSendTypeCallback(
				notificationsConfiguration,
				(checkBox.value(notificationsConfiguration).sendType + 1) % 2, // todo enum length
				buttonInteraction.channel!.id
			);
			await buttonInteraction.update({
				embeds: [{
					title: "Notifications configuration",
					description: getNotificationsEmbedDescription(notificationsConfiguration),
					footer: {text: "Click on the buttons below to change the send location"}
				}],
				components: [row]
			});
		}
	});

	buttonCollector.on("end", async () => {
		currentCollectors.delete(buttonInteraction.user.id);
		await notificationsConfiguration.save();
	});
}

function getNotificationsEmbedDescription(notificationsConfiguration: NotificationsConfiguration): string {
	let description = "";
	checkBoxes.forEach(checkBox => {
		const checkBoxValue = checkBox.value(notificationsConfiguration);
		description += `${checkBox.emote} **${checkBox.name}**: ${checkBoxValue.enabled ? "✅" : "❌"} - ${NotificationSendType.toString(checkBoxValue.sendType, checkBoxValue.channelId)}\n`;
	});
	return description;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("notifications"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};