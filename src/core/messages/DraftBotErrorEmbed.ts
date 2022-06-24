import {DraftBotEmbed} from "./DraftBotEmbed";
import {CommandInteraction, User} from "discord.js";
import {Translations} from "../Translations";

/**
 * Default error embed with the title and description formatted. If you just want the red color, see {@link DraftBotEmbed#setErrorColor}
 */
export class DraftBotErrorEmbed extends DraftBotEmbed {
	constructor(user: User, interaction: CommandInteraction, language: string, reason: string, isCancelling = false) {
		const isOther = interaction.user !== user;
		super();
		this.setErrorColor();
		this.formatAuthor(Translations.getModule("error", language).getFromArray("title", isCancelling ? 1 : isOther ? 2 : 0), interaction ? interaction.user : user);
		this.setDescription(reason);
	}

}