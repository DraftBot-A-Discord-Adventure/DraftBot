import {CommandInteraction, User} from "discord.js";
import {DraftBotErrorEmbed} from "../messages/DraftBotErrorEmbed";
import {Translations} from "../Translations";
import Entity from "../database/game/models/Entity";
import {millisecondsToMinutes, minutesDisplay} from "./TimeUtils";
import {escapeUsername} from "./StringUtils";
import {EffectsConstants} from "../constants/EffectsConstants";

/**
 * Send an error message if the user has an effect
 * @param user
 * @param language
 * @param entity
 */
export const effectsErrorTextValue = async function(user: User, language: string, entity: Entity): Promise<{ title: string, description: string }> {
	const startString = user.id === entity.discordUserId ? "titleMe" : "player";
	const stringEnd = EffectsConstants.ERROR_TEXT[entity.Player.effect as keyof typeof EffectsConstants.ERROR_TEXT];
	const tr = Translations.getModule("error", language);
	const errorMessageObject = {
		title: tr.format(`${startString}Is${stringEnd}`, {
			askedPseudo: escapeUsername(await entity.Player.getPseudo(language))
		}),
		description: `${entity.Player.effect} `
	};
	const timeEffect = minutesDisplay(millisecondsToMinutes(entity.Player.effectRemainingTime()));
	switch (entity.Player.effect) {
	case EffectsConstants.EMOJI_TEXT.SMILEY:
		errorMessageObject.description += tr.get("notPossibleWithoutStatus");
		break;
	case EffectsConstants.EMOJI_TEXT.BABY:
	case EffectsConstants.EMOJI_TEXT.DEAD:
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

/**
 * Reply to an interaction with a given error
 * @param interaction
 * @param language
 * @param reason
 */
export async function replyErrorMessage(interaction: CommandInteraction, language: string, reason: string): Promise<void> {
	await interaction.reply({
		embeds: [new DraftBotErrorEmbed(interaction.user, interaction, language, reason)],
		ephemeral: true
	});
}

/**
 * Sends an error message
 * @param user
 * @param interaction
 * @param language
 * @param reason
 * @param isCancelling
 */
export async function sendErrorMessage(
	user: User,
	interaction: CommandInteraction,
	language: string,
	reason: string,
	isCancelling = false
): Promise<void> {
	await interaction.channel.send({
		embeds: [new DraftBotErrorEmbed(user, interaction, language, reason, isCancelling)]
	});
}

