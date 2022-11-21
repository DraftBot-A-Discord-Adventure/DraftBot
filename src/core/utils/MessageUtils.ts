import {error} from "console";
import {User} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";

/**
 * Send a dm to a user
 * @param {User} user
 * @param {DraftBotEmbed} embed - The embed to send
 * @param {("fr"|"en")} language - Language to use in the response
 * @param DirectMessageFooter - Add the dmMessage footer
 */
export function sendDirectMessage(user: User, embed : DraftBotEmbed, language: string, DirectMessageFooter = true): void {
	DirectMessageFooter ? embed.setFooter({text: Translations.getModule("models.players", language).get("dmEnabledFooter")}) : null;
	user.send({
		embeds: [embed]
	}).catch(() => {
		error(`Can't send dm to user ${user.id}`);
	});
}