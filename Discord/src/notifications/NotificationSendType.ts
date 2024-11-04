export enum NotificationSendType {
	DM = 0,
	CHANNEL = 1
}

export module NotificationSendType {
	export function toString(sendType: NotificationSendType, channelId: string | undefined): string {
		return sendType === NotificationSendType.DM ? "In DM" : `In <#${channelId}>`; // todo i18n
	}
}
