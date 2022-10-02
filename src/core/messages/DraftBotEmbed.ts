import {EmbedBuilder, HexColorString, User} from "discord.js";
import {escapeUsername} from "../utils/StringUtils";
import {Constants} from "../Constants";
import {format} from "../utils/StringFormatter";

/**
 * Base class for bot embeds
 */
export class DraftBotEmbed extends EmbedBuilder {
	/**
	 * Default constructor
	 */
	constructor() {
		super();
	}

	/**
	 * Add the title and the user icon as title of the embed
	 * pseudo is automatically replaced in the title. If you have other replacements you have to replace it yourself before
	 * @param title
	 * @param user
	 * @param userToLook
	 */
	formatAuthor(title: string, user: User, userToLook: User = user): this {
		this.setAuthor({
			name: format(title, {
				pseudo: escapeUsername(userToLook.username)
			}),
			iconURL: user.displayAvatarURL()
		});
		return this;
	}

	setErrorColor(): this {
		this.setColor(<HexColorString>Constants.MESSAGES.COLORS.ERROR);
		return this;
	}
}