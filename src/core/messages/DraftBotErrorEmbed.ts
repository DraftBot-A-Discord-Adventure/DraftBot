import {DraftBotEmbed} from "./DraftBotEmbed";
import {User} from "discord.js";

declare const JsonReader: any;
declare function format(s: string, replacement: any): string;

export class DraftBotErrorEmbed extends DraftBotEmbed {
	constructor(user: User, language: string, reason: string, isCancelling = false) {
		super();
		this.setColor(JsonReader.bot.embed.error)
			.setAuthor(format(JsonReader.error.getTranslation(language).title[isCancelling ? 1 : 0], {
				pseudo: user.username
			}), user.displayAvatarURL())
			.setDescription(reason);
	}
}