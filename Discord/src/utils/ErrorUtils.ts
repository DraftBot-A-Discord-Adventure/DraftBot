import {MessageComponentInteraction, User} from "discord.js";
import {DraftBotErrorEmbed} from "../messages/DraftBotErrorEmbed";
import {Language} from "../../../Lib/src/Language";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";
import i18n from "../translations/i18n";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {escapeUsername} from "../../../Lib/src/utils/StringUtils";
import {KeycloakUser} from "../../../Lib/src/keycloak/KeycloakUser";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {millisecondsToMinutes, minutesDisplay} from "../../../Lib/src/utils/TimeUtils";
import {Effect} from "../../../Lib/src/enums/Effect";

/**
 * Reply to an interaction with an ephemeral error PREFER {@link sendErrorMessage} for most cases
 * @param interaction
 * @param reason
 */
export async function replyEphemeralErrorMessage(interaction: DraftbotInteraction, reason: string): Promise<void> {
	await interaction.reply({
		embeds: [new DraftBotErrorEmbed(interaction.user, interaction, reason)],
		ephemeral: true
	});
}

export enum SendManner {
	SEND = "SEND",
	REPLY = "REPLY",
	FOLLOWUP = "FOLLOWUP",
	EDIT_REPLY = "EDIT_REPLY"
}

/**
 * Sends an error message
 * @param user
 * @param interaction
 * @param reason
 * @param isCancelling - true if the error is a cancelling error
 * @param isBlockedError - set to false if you don't want the "this user is blocked" message when selecting a different user than the one who invoked the command
 * @param sendManner
 */
export async function sendErrorMessage(
	user: User,
	interaction: DraftbotInteraction,
	reason: string,
	{
		isCancelling = false,
		isBlockedError = true,
		sendManner = SendManner.SEND
	}: {
		isCancelling?: boolean,
		isBlockedError?: boolean,
		sendManner?: SendManner
	} = {}
): Promise<void> {
	const sendArg = {
		embeds: [new DraftBotErrorEmbed(user, interaction, reason, isCancelling, isBlockedError)]
	};
	switch (sendManner) {
	case SendManner.REPLY:
		await interaction.reply(sendArg);
		break;
	case SendManner.EDIT_REPLY:
		await interaction.editReply(sendArg);
		break;
	case SendManner.FOLLOWUP:
		await interaction.followUp(sendArg);
		break;
	default:
		await interaction.channel.send(sendArg);
		break;
	}
}

export async function sendInteractionNotForYou(
	user: User,
	interaction: MessageComponentInteraction,
	lng: Language
): Promise<void> {
	await interaction.reply({
		embeds: [
			new DraftBotEmbed()
				.setDescription(i18n.t("error:interactionNotForYou", {lng}))
				.setErrorColor()
				.formatAuthor(i18n.t("error:titleDidntWork", {lng, pseudo: user.username}), user)
		],
		ephemeral: true
	});
}

/**
 * Send an error message if the user has an effect
 * @param user
 * @param lng
 * @param self
 * @param effectId
 * @param effectRemainingTime
 */
export function effectsErrorTextValue(user: KeycloakUser, lng: Language, self: boolean, effectId: string, effectRemainingTime: number): {
	title: string,
	description: string
} {
	const translationKey = self ? `error:effects.${effectId}.self` : `error:effects.${effectId}.other`;
	const errorMessageObject: { title: string, description: string } = {
		title: i18n.t(translationKey, {
			lng,
			pseudo: escapeUsername(user.attributes.gameUsername[0])
		}),
		description: `${DraftBotIcons.effects[effectId]} `
	};
	const timeEffect = minutesDisplay(millisecondsToMinutes(effectRemainingTime));

	switch (effectId) {
	case Effect.NO_EFFECT.id:
		errorMessageObject.description += i18n.t("error:notPossibleWithoutStatus", {lng});
		break;
	case Effect.NOT_STARTED.id:
		errorMessageObject.description += i18n.t(self ? "error:effects.notStartedHint.self" : "error:effects.notStartedHint.other", {lng});
		break;
	case Effect.DEAD.id:
		errorMessageObject.description += i18n.t(self ? "error:effects.deadHint.self" : "error:effects.deadHint.other", {lng});
		break;
	default:
		errorMessageObject.description += i18n.t(self ? "error:pleaseWaitForHeal" : "error:pleaseWaitForHisHeal", {
			lng,
			time: timeEffect
		});
	}

	if (self) {
		errorMessageObject.title = errorMessageObject.title.charAt(8).toUpperCase() + errorMessageObject.title.slice(9);
	}

	return errorMessageObject;
}