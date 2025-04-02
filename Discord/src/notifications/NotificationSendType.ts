import i18n from "../translations/i18n";
import { Language } from "../../../Lib/src/Language";
import { getChannelMention } from "../../../Lib/src/utils/StringUtils";

export enum NotificationSendTypeEnum {
	DM = 0,
	CHANNEL = 1
}

function toString(sendType: NotificationSendTypeEnum, lng: Language, channelId: string | undefined): string {
	return sendType === NotificationSendTypeEnum.DM
		? i18n.t("commands:notifications.inDM", { lng })
		: i18n.t("commands:notifications.inChannel", {
			lng,
			channel: getChannelMention(channelId!),
			interpolation: { escapeValue: false }
		});
}

export const NotificationSendType = {
	toString
};
