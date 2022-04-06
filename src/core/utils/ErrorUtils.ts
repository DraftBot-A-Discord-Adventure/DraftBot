import {BlockingUtils} from "./BlockingUtils";
import {CommandInteraction, TextBasedChannel, User} from "discord.js";
import {DraftBotErrorEmbed} from "../messages/DraftBotErrorEmbed";
import {Translations} from "../Translations";
import {Constants} from "../Constants";
import Entity from "../models/Entity";
import {format} from "./StringFormatter";
import {millisecondsToMinutes, minutesDisplay} from "./TimeUtils";

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

export const effectsErrorMeTextValue = function(user: User, language: string, entity: Entity, effect: string): { title: string, description: string } {

	const tr = Translations.getModule("error", language);
	const errorMessageObject = {
		title: "",
		description: ""
	};
	if (effect === Constants.EFFECT.SMILEY) {
		errorMessageObject.title = tr.get("titleMeIsFine");
		errorMessageObject.description = entity.Player.effect + tr.get("notPossibleWithoutStatus");
	}

	if (effect === Constants.EFFECT.BABY) {
		errorMessageObject.title = tr.get("titleMeIsBaby");
		errorMessageObject.description = entity.Player.effect + tr.get("meIsBaby");
	}

	if (effect === Constants.EFFECT.DEAD) {
		errorMessageObject.title = tr.get("titleMeIsDead");
		errorMessageObject.description = entity.Player.effect + tr.get("meIsDead");
	}

	const timeEffect = minutesDisplay(millisecondsToMinutes(entity.Player.effectRemainingTime()));
	if (effect === Constants.EFFECT.SLEEPING) {
		errorMessageObject.title = tr.get("titleMeIsSleeping");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}

	if (effect === Constants.EFFECT.DRUNK) {
		errorMessageObject.title = tr.get("titleMeIsDrunk");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}
	if (effect === Constants.EFFECT.HURT) {
		errorMessageObject.title = tr.get("titleMeIsHurt");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}

	if (effect === Constants.EFFECT.SICK) {
		errorMessageObject.title = tr.get("titleMeIsSick");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}

	if (effect === Constants.EFFECT.LOCKED) {
		errorMessageObject.title = tr.get("titleMeIsLocked");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}
	if (effect === Constants.EFFECT.INJURED) {
		errorMessageObject.title = tr.get("titleMeIsInjured");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}
	if (effect === Constants.EFFECT.SCARED) {
		errorMessageObject.title = tr.get("titleMeIsScared");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}

	if (effect === Constants.EFFECT.OCCUPIED) {
		errorMessageObject.title = tr.get("titleMeIsOccupied");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}

	if (effect === Constants.EFFECT.CONFOUNDED) {
		errorMessageObject.title = tr.get("titleMeIsConfounded");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}

	if (effect === Constants.EFFECT.FROZEN) {
		errorMessageObject.title = tr.get("titleMeIsFrozen");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}
	if (effect === Constants.EFFECT.STARVING) {
		errorMessageObject.title = tr.get("titleMeIsStarving");
		errorMessageObject.description = format(entity.Player.effect + tr.get("pleaseWaitForHeal"), {time: timeEffect});
	}

	errorMessageObject.title = errorMessageObject.title.charAt(10).toUpperCase() + errorMessageObject.title.slice(11);

	return errorMessageObject;
};

export function sendErrorMessage(user: User, channel: TextBasedChannel, language: string, reason: string, isCancelling = false, interaction: CommandInteraction = null) {
	if (interaction) {
		if (isCancelling) {
			return interaction.reply({embeds: [new DraftBotErrorEmbed(user, language, reason, true)]});
		}
		return interaction.reply({embeds: [new DraftBotErrorEmbed(user, language, reason, false)], ephemeral: true});
	}
	return channel.send({embeds: [new DraftBotErrorEmbed(user, language, reason, isCancelling)]});
}

