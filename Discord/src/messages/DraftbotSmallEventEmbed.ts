import {DraftBotEmbed} from "./DraftBotEmbed";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import i18n from "../translations/i18n";
import {Language} from "../../../Lib/src/Language";
import {User} from "discord.js";
import {EmoteUtils} from "../utils/EmoteUtils";

export class DraftbotSmallEventEmbed extends DraftBotEmbed {
	constructor(smallEventId: keyof typeof DraftBotIcons.small_events, description: string, user: User, language: Language) {
		super();
		this.setAuthor({
			name: i18n.t("commands:report.journal", {lng: language, pseudo: user.displayName}),
			iconURL: user.displayAvatarURL()
		});
		this.setDescription(`${EmoteUtils.translateEmojiToDiscord(DraftBotIcons.small_events[smallEventId])} ${description}`);
	}
}