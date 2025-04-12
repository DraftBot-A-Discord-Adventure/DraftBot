import { DraftBotEmbed } from "./DraftBotEmbed";
import { User } from "discord.js";
import { DraftbotInteraction } from "./DraftbotInteraction";
import i18n from "../translations/i18n";
import { escapeUsername } from "../utils/StringUtils";

/**
 * Default error embed with the title and description formatted. If you just want the red color, see {@link DraftBotEmbed#setErrorColor}
 */
export class DraftBotErrorEmbed extends DraftBotEmbed {
	constructor(user: User, interaction: DraftbotInteraction, reason: string, isCancelling = false, isBlockedError = true) {
		super();
		this.setErrorColor();
		this.setDescription(reason);

		const isOther = interaction.user !== user;
		this.formatAuthor(i18n.t(isCancelling ? "error:titleCanceled" : isOther && isBlockedError ? "error:titleBlocked" : "error:titleDidntWork", {
			lng: interaction.userLanguage,
			pseudo: escapeUsername(user.displayName)
		}), user);
	}
}
