import {HexColorString, User} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";

/**
 * Send a dm to a user
 * @param {User} user
 * @param {String} title - Title of the DM, title must be of format "*{pseudo}*"
 * @param {String} description - Description of the DM
 * @param {string} color - Color of the DM
 * @param {("fr"|"en")} language - Language to use in the response
 */

export function sendDirectMessage(user: User, title: string, description: string, color: string, language: string): void  {
	try {
		user.send({
			embeds: [new DraftBotEmbed()
				.setColor(color as HexColorString)
				.formatAuthor(title, user)
				.setDescription(description)
				.setFooter(Translations.getModule("models.players", language).get("dmEnabledFooter"))]
		});
		// TODO REFACTOR LES LOGS
		// log("Dm sent to " + user.id + ", title : " + title + ", description : " + description);
	}
	catch (err) {
		// TODO REFACTOR LES LOGS
		// log("user" + user.id + "has closed dms !");
	}
}