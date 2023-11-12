import {DraftBotEmbed} from "./DraftBotEmbed";
import {User} from "discord.js";
import {Translations} from "../Translations";
import {DraftbotInteraction} from "./DraftbotInteraction";

/**
 * Default error embed with the title and description formatted. If you just want the red color, see {@link DraftBotEmbed#setErrorColor}
 */
export class DraftBotErrorEmbed extends DraftBotEmbed {
	constructor(user: User, interaction: DraftbotInteraction, language: string, reason: string, isCancelling = false, isBlockedError = true) {
		const isOther = interaction.user !== user;
		super();
		this.setErrorColor();
		this.formatAuthor(Translations.getModule("error", language).getFromArray("title", isCancelling ? 1 : isOther && isBlockedError ? 2 : 0), user);
		this.setDescription(reason);
	}

}