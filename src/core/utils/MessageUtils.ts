import {CommandInteraction, HexColorString, MessageReaction, ReactionCollector, User} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {Translations} from "../Translations";
import {Constants} from "../Constants";

/**
 * Send a dm to a user
 * @param {User} user
 * @param {String} title - Title of the DM, title must be of format "*{pseudo}*"
 * @param {String} description - Description of the DM
 * @param {string} color - Color of the DM
 * @param {("fr"|"en")} language - Language to use in the response
 */

export function sendDirectMessage(user: User, title: string, description: string, color: string, language: string): void {
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

/**
 * Check if a broadcast message is still active or not (avoid duplicate answers from the bot, for example in spam situation or sync reactions)
 * @param interaction
 * @param collector
 * @param reaction
 * @param spamCounter
 */
export function isBroadcastStillActive(interaction: CommandInteraction, collector: ReactionCollector, reaction: MessageReaction, spamCounter = 0): boolean {
	// has the main user cancelled the broadcast
	if (collector.collected.get(Constants.MENU_REACTION.DENY) &&
		collector.collected.get(Constants.MENU_REACTION.DENY).users.cache.has(interaction.user.id) &&
		interaction.user.id !== reaction.users.cache.at(reaction.users.cache.keys.length - 1).id) {
		return false;
	}
	// has any user already accepted correctly the broadcast
	return !(collector.collected.get(Constants.MENU_REACTION.ACCEPT) &&
		collector.collected.get(Constants.MENU_REACTION.ACCEPT).count > spamCounter + 1 +
		(collector.collected.get(Constants.MENU_REACTION.DENY) &&
		collector.collected.get(Constants.MENU_REACTION.DENY).users.cache.has(interaction.user.id) ? 0 : 1));
}