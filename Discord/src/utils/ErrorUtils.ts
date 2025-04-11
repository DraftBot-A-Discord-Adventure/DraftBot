import {
	MessageComponentInteraction, User
} from "discord.js";
import { DraftBotErrorEmbed } from "../messages/DraftBotErrorEmbed";
import { Language } from "../../../Lib/src/Language";
import { DraftbotInteraction } from "../messages/DraftbotInteraction";
import i18n from "../translations/i18n";
import { DraftBotEmbed } from "../messages/DraftBotEmbed";
import { escapeUsername } from "../../../Lib/src/utils/StringUtils";
import { KeycloakUser } from "../../../Lib/src/keycloak/KeycloakUser";
import {
	millisecondsToMinutes, minutesDisplay
} from "../../../Lib/src/utils/TimeUtils";
import { Effect } from "../../../Lib/src/types/Effect";
import { PacketContext } from "../../../Lib/src/packets/DraftBotPacket";
import { MessagesUtils } from "./MessagesUtils";
import { MessageFlags } from "discord-api-types/v10";

/**
 * Reply to an interaction with an ephemeral error PREFER {@link sendErrorMessage} for most cases
 * @param interaction
 * @param reason
 */
export async function replyEphemeralErrorMessage(interaction: DraftbotInteraction, reason: string): Promise<void> {
	if (interaction.deferred) {
		await interaction.deleteReply();
	}

	// Without a bind, context is lost for "this"
	await (interaction.replied || interaction.deferred ? interaction.followUp.bind(interaction) : interaction.reply.bind(interaction))({
		embeds: [new DraftBotErrorEmbed(interaction.user, interaction, reason)],
		flags: MessageFlags.Ephemeral
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
		isCancelling?: boolean;
		isBlockedError?: boolean;
		sendManner?: SendManner;
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
				.setDescription(i18n.t("error:interactionNotForYou", { lng }))
				.setErrorColor()
				.formatAuthor(i18n.t("error:titleDidntWork", {
					lng,
					pseudo: user.displayName
				}), user)
		],
		flags: MessageFlags.Ephemeral
	});
}

/**
 * Get the translation key for the description of an effect
 * @param effectId
 * @param self
 */
function getDescriptionTranslationKey(effectId: string, self: boolean): string {
	switch (effectId) {
		case Effect.NO_EFFECT.id:
			return "error:notPossibleWithoutStatus";
		case Effect.NOT_STARTED.id:
			return `error:effects.notStartedHint.${self ? "self" : "other"}`;
		case Effect.DEAD.id:
			return `error:effects.deadHint.${self ? "self" : "other"}`;
		default:
			return self ? "error:pleaseWaitForHeal" : "error:pleaseWaitForHisHeal";
	}
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
	title: string;
	description: string;
} {
	return {
		title: i18n.t(`error:effects.${effectId}.${self ? "self" : "other"}`, {
			lng,
			pseudo: escapeUsername(user.attributes.gameUsername[0])
		}),
		description: i18n.t(`{emote:effects.${effectId}} $t(${getDescriptionTranslationKey(effectId, self)})`, {
			lng,
			time: minutesDisplay(millisecondsToMinutes(effectRemainingTime))
		})
	};
}

/**
 * Handle classical errors
 * @param context
 * @param errorKey
 * @param replacements
 * @param ephemeral
 */
export async function handleClassicError(context: PacketContext, errorKey: string, replacements: { [key: string]: unknown } = {}, ephemeral = false): Promise<void> {
	const interactionToRespondTo = MessagesUtils.getCurrentInteraction(context);

	await (!interactionToRespondTo.replied
		? interactionToRespondTo.deferred
			? interactionToRespondTo.editReply.bind(interactionToRespondTo)
			: interactionToRespondTo.reply.bind(interactionToRespondTo)
		: interactionToRespondTo.followUp.bind(interactionToRespondTo)
	)({
		embeds: [
			new DraftBotErrorEmbed(
				interactionToRespondTo.user,
				interactionToRespondTo,
				i18n.t(errorKey, {
					lng: interactionToRespondTo.userLanguage,
					...replacements
				})
			)
		],
		flags: ephemeral ? MessageFlags.Ephemeral as number : 0
	});
}
