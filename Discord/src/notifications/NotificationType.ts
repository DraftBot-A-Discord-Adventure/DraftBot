import { NotificationSendTypeEnum } from "./NotificationSendType";
import { DraftBotIcons } from "../../../Lib/src/DraftBotIcons";
import NotificationsConfiguration from "../database/discord/models/NotificationsConfiguration";

export type NotificationType = {
	emote: string;
	customId: string;
	i18nKey: string;
	value: (notificationsConfiguration: NotificationsConfiguration) => {
		enabled: boolean;
		sendType: NotificationSendTypeEnum;
		channelId?: string;
	};
	toggleCallback: (notificationsConfiguration: NotificationsConfiguration) => void;
	changeSendTypeCallback: (notificationsConfiguration: NotificationsConfiguration, sendType: NotificationSendTypeEnum, channelId: string) => void;
};

export abstract class NotificationsTypes {
	static REPORT: NotificationType = {
		emote: DraftBotIcons.notifications.types.report,
		customId: "report",
		i18nKey: "commands:notifications.types.report",
		value: notificationsConfiguration => ({
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
	};

	static GUILD_DAILY: NotificationType = {
		emote: DraftBotIcons.notifications.types.guildDaily,
		customId: "guildDaily",
		i18nKey: "commands:notifications.types.guildDaily",
		value: notificationsConfiguration => ({
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
	};

	static GUILD_KICK: NotificationType = {
		emote: DraftBotIcons.notifications.types.guildKick,
		customId: "guildKick",
		i18nKey: "commands:notifications.types.guildKick",
		value: notificationsConfiguration => ({
			enabled: notificationsConfiguration.guildKickEnabled,
			sendType: notificationsConfiguration.guildKickSendType,
			channelId: notificationsConfiguration.guildKickChannelId
		}),
		toggleCallback: (notificationsConfiguration): void => {
			notificationsConfiguration.guildKickEnabled = !notificationsConfiguration.guildKickEnabled;
		},
		changeSendTypeCallback: (notificationsConfiguration, sendType, channelId): void => {
			notificationsConfiguration.guildKickSendType = sendType;
			notificationsConfiguration.guildKickChannelId = channelId;
		}
	};

	static GUILD_STATUS_CHANGE: NotificationType = {
		emote: DraftBotIcons.notifications.types.guildStatusChange,
		customId: "guildStatusChange",
		i18nKey: "commands:notifications.types.guildStatusChange",
		value: notificationsConfiguration => ({
			enabled: notificationsConfiguration.guildStatusChangeEnabled,
			sendType: notificationsConfiguration.guildStatusChangeSendType,
			channelId: notificationsConfiguration.guildStatusChangeChannelId
		}),
		toggleCallback: (notificationsConfiguration): void => {
			notificationsConfiguration.guildStatusChangeEnabled = !notificationsConfiguration.guildStatusChangeEnabled;
		},
		changeSendTypeCallback: (notificationsConfiguration, sendType, channelId): void => {
			notificationsConfiguration.guildStatusChangeSendType = sendType;
			notificationsConfiguration.guildStatusChangeChannelId = channelId;
		}
	};

	static PLAYER_FREED_FROM_JAIL: NotificationType = {
		emote: DraftBotIcons.notifications.types.playerFreedFromJail,
		customId: "playerFreedFromJail",
		i18nKey: "commands:notifications.types.playerFreedFromJail",
		value: notificationsConfiguration => ({
			enabled: notificationsConfiguration.playerFreedFromJailEnabled,
			sendType: notificationsConfiguration.playerFreedFromJailSendType,
			channelId: notificationsConfiguration.playerFreedFromJailChannelId
		}),
		toggleCallback: (notificationsConfiguration): void => {
			notificationsConfiguration.playerFreedFromJailEnabled = !notificationsConfiguration.playerFreedFromJailEnabled;
		},
		changeSendTypeCallback: (notificationsConfiguration, sendType, channelId): void => {
			notificationsConfiguration.playerFreedFromJailSendType = sendType;
			notificationsConfiguration.playerFreedFromJailChannelId = channelId;
		}
	};

	static FIGHT_CHALLENGE: NotificationType = {
		emote: DraftBotIcons.notifications.types.fightChallenge,
		customId: "fightChallenge",
		i18nKey: "commands:notifications.types.fightChallenge",
		value: notificationsConfiguration => ({
			enabled: notificationsConfiguration.fightChallengeEnabled,
			sendType: notificationsConfiguration.fightChallengeSendType,
			channelId: notificationsConfiguration.fightChallengeChannelId
		}),
		toggleCallback: (notificationsConfiguration): void => {
			notificationsConfiguration.fightChallengeEnabled = !notificationsConfiguration.fightChallengeEnabled;
		},
		changeSendTypeCallback: (notificationsConfiguration, sendType, channelId): void => {
			notificationsConfiguration.fightChallengeSendType = sendType;
			notificationsConfiguration.fightChallengeChannelId = channelId;
		}
	};

	static ALL: NotificationType[] = [
		NotificationsTypes.REPORT,
		NotificationsTypes.GUILD_DAILY,
		NotificationsTypes.PLAYER_FREED_FROM_JAIL,
		NotificationsTypes.FIGHT_CHALLENGE,
		NotificationsTypes.GUILD_KICK,
		NotificationsTypes.GUILD_STATUS_CHANGE
	];
}
