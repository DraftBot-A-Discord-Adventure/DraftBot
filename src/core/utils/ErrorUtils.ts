import {CommandInteraction, User} from "discord.js";
import {DraftBotErrorEmbed} from "../messages/DraftBotErrorEmbed";
import {Translations} from "../Translations";
import {Constants} from "../Constants";
import Entity from "../database/game/models/Entity";
import {millisecondsToMinutes, minutesDisplay} from "./TimeUtils";
import {escapeUsername} from "./StringUtils";

/**
 * Send an error message if the user has an effect
 * @param user
 * @param language
 * @param entity
 */
export const effectsErrorTextValue = async function(user: User, language: string, entity: Entity): Promise<{ title: string, description: string }> {
	const startString = user.id === entity.discordUserId ? "titleMe" : "player";
	const stringEnd = Constants.EFFECT.ERROR_TEXT[entity.Player.effect as keyof typeof Constants.EFFECT.ERROR_TEXT];
	const tr = Translations.getModule("error", language);
	const errorMessageObject = {
		title: tr.format(`${startString}Is${stringEnd}`, {
			askedPseudo: escapeUsername(await entity.Player.getPseudo(language))
		}),
		description: entity.Player.effect + " "
	};
	const timeEffect = minutesDisplay(millisecondsToMinutes(entity.Player.effectRemainingTime()));
	switch (entity.Player.effect) {
	case Constants.EFFECT.SMILEY:
		errorMessageObject.description += tr.get("notPossibleWithoutStatus");
		break;
	case Constants.EFFECT.BABY:
	case Constants.EFFECT.DEAD:
		errorMessageObject.description += tr.format(startString === "titleMe" ? `meIs${stringEnd}` : `${startString}Is${stringEnd}`, {
			askedPseudo: "Il"
		});
		break;
	default:
		errorMessageObject.description += tr.format(startString === "titleMe" ? "pleaseWaitForHeal" : "pleaseWaitForHisHeal", {time: timeEffect});
	}

	if (startString === "titleMe") {
		errorMessageObject.title = errorMessageObject.title.charAt(8).toUpperCase() + errorMessageObject.title.slice(9);
	}

	return errorMessageObject;
};

export async function replyErrorMessage(interaction: CommandInteraction, language: string, reason: string) {
	return await interaction.reply({
		embeds: [new DraftBotErrorEmbed(interaction.user, interaction, language, reason)],
		ephemeral: true
	});
}

export async function sendErrorMessage(user: User, interaction: CommandInteraction, language: string, reason: string, isCancelling = false) {
	return await interaction.channel.send({
		embeds: [new DraftBotErrorEmbed(user, interaction, language, reason, isCancelling)]
	});
}

