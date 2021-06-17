import {DraftBotEmbed} from "./DraftBotEmbed";
import {User} from "discord.js";

declare const JsonReader: any;

/**
 * Default error embed with the title and description formatted. If you just want the red color, see {@link DraftBotEmbed#setErrorColor}
 */
export class DraftBotErrorEmbed extends DraftBotEmbed {
	constructor(user: User, language: string, reason: string, isCancelling = false) {
		super();
		this.setErrorColor();
		this.formatAuthor(JsonReader.error.getTranslation(language).title[isCancelling ? 1 : 0], user);
		this.setDescription(reason);
	}
}