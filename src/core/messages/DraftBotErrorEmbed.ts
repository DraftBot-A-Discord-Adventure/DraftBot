import {DraftBotEmbed} from "./DraftBotEmbed";
import {User} from "discord.js";
import {Translations} from "../Translations";

/**
 * Default error embed with the title and description formatted. If you just want the red color, see {@link DraftBotEmbed#setErrorColor}
 */
export class DraftBotErrorEmbed extends DraftBotEmbed {
	constructor(user: User, language: string, reason: string, isCancelling = false) {
		super();
		this.setErrorColor();
		this.formatAuthor(Translations.getModule("error", language).getFromArray("title", isCancelling ? 1 : 0), user);
		this.setDescription(reason);
	}
}