import {MessageEmbed, User} from "discord.js";
import {escapeUsername} from "../utils/StringUtils";
import {format} from "../utils/StringFormatter";

/**
 * Base class for bot embeds
 */
export class DraftBotEmbed extends MessageEmbed {
	/**
	 * Default constructor
	 */
	constructor() {
		super();
		// Ignore this for now
		// this.setColor(Constants.MESSAGES.COLORS.DEFAULT);
	}

	/**
	 * Add the title and the user icon as title of the embed
	 * pseudo is automatically replaced in the title. If you have other replacements you have to replace it yourself before
	 * @param title
	 * @param user
	 */
	formatAuthor(title: string, user: User): DraftBotEmbed {
		this.setAuthor(format(title, {
			pseudo: escapeUsername(user.username)
		}), user.displayAvatarURL());
		return this;
	}

	setErrorColor(): DraftBotEmbed {
		this.setColor(null);
		return this;
	}
}