import {BlockingUtils} from "./BlockingUtils";
import {CommandInteraction, TextBasedChannel, User} from "discord.js";
import {DraftBotErrorEmbed} from "../messages/DraftBotErrorEmbed";
import {Translations} from "../Translations";
import {Constants} from "../Constants";
import Entity from "../models/Entity";
import {millisecondsToMinutes, minutesDisplay} from "./TimeUtils";
import {escapeUsername} from "./StringUtils";

export const sendBlockedErrorInteraction = async function(interaction: CommandInteraction, language: string) {
	const blockingReason = await BlockingUtils.getPlayerBlockingReason(interaction.user.id);
	if (blockingReason !== null) {
		const tr = Translations.getModule("error", language);
		await interaction.reply({
			embeds: [
				new DraftBotErrorEmbed(interaction.user, language, tr.format("playerBlocked", {
					context: tr.get("blockedContext." + blockingReason)
				}))
			]
		});
		return true;
	}
	return false;
};

export const effectsErrorMeTextValue = async function(user: User, language: string, entity: Entity): Promise<{ title: string, description: string }> {
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

export function replyErrorMessage(interaction: CommandInteraction, language: string, reason: string, isCancelling = false) {
	if (isCancelling) {
		return interaction.reply({embeds: [new DraftBotErrorEmbed(interaction.user, language, reason, true)]});
	}
	return interaction.reply({
		embeds: [new DraftBotErrorEmbed(interaction.user, language, reason, false)],
		ephemeral: true
	});
}

export function sendErrorMessage(user: User, channel: TextBasedChannel, language: string, reason: string, isCancelling = false, interaction: CommandInteraction = null) {
	if (interaction) {
		if (isCancelling) {
			return interaction.reply({embeds: [new DraftBotErrorEmbed(user, language, reason, true)]});
		}
		return interaction.reply({embeds: [new DraftBotErrorEmbed(user, language, reason, false)], ephemeral: true});
	}
	return channel.send({embeds: [new DraftBotErrorEmbed(user, language, reason, isCancelling)]});
}

