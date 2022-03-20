import {DraftBotEmbed} from "./messages/DraftBotEmbed";
import {Permissions} from "discord.js";

class MessageError {

	/**
	 *
	 * @param member
	 * @param interaction
	 * @param language
	 * @param permission
	 * @returns {Promise<boolean|*>}
	 */
	static async canPerformCommand(member, interaction, language, permission) {
		if (permission === PERMISSION.ROLE.ADMINISTRATOR) {
			if (!member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) && !MessageError.isBotOwner(member.id)) {
				return await MessageError.permissionErrorMe(member.user, interaction, language, permission);
			}
		}
		return true;
	}

	/**
	 * @param {string} id
	 * @return {boolean}
	 */
	static isBotOwner(id) {
		return id === JsonReader.app.BOT_OWNER_ID;
	}

	/**
	 * Reply with an error "missing permissions"
	 * @param user
	 * @param interaction
	 * @param language
	 * @param permission
	 * @returns {Promise<*>}
	 */
	static async permissionErrorMe(user, interaction, language, permission) {
		const embed = new DraftBotEmbed()
			.setErrorColor()
			.formatAuthor(JsonReader.error.getTranslation(language).titlePermissionError, user);

		if (permission === PERMISSION.ROLE.ADMINISTRATOR) {
			embed.setDescription(JsonReader.error.getTranslation(language).administratorPermissionMissing);
		}
		return await interaction.reply({embeds: [embed]});
	}

	static async effectsErrorMe(user, channel, language, entity, effect) {

		const embed = new DraftBotEmbed().setErrorColor();

		if (effect === EFFECT.SMILEY) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsFine, user)
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).notPossibleWithoutStatus);
		}

		if (effect === EFFECT.BABY) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsBaby, user)
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).meIsBaby);
		}

		if (effect === EFFECT.DEAD) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsDead, user)
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).meIsDead);
		}

		const timeEffect = minutesToString(millisecondsToMinutes(entity.Player.effectRemainingTime()));
		if (effect === EFFECT.SLEEPING) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsSleeping, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.DRUNK) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsDrunk, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}
		if (effect === EFFECT.HURT) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsHurt, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.SICK) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsSick, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.LOCKED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsLocked, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWait, {time: timeEffect}));
		}
		if (effect === EFFECT.INJURED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsInjured, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}
		if (effect === EFFECT.SCARED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsScared, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.OCCUPIED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsOccupied, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.CONFOUNDED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsConfounded, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.FROZEN) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsFrozen, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}
		if (effect === EFFECT.STARVING) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsStarving, user)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		return await channel.send({embeds: [embed]});
	}

	/**
	 * @param {module:"discord.js".Message} message - Message from the discord server
	 * @param {("fr"|"en")} language
	 * @param {Entities} entity
	 * @param {String} effect
	 * @return {Object} error message object (title , description)
	 */
	static effectsErrorMeTextValue(message, language, entity, effect) {

		const errorMessageObject = {
			title: "",
			description: ""
		};
		if (effect === EFFECT.SMILEY) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsFine;
			errorMessageObject.description = entity.Player.effect + JsonReader.error.getTranslation(language).notPossibleWithoutStatus;
		}

		if (effect === EFFECT.BABY) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsBaby;
			errorMessageObject.description = entity.Player.effect + JsonReader.error.getTranslation(language).meIsBaby;
		}

		if (effect === EFFECT.DEAD) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsDead;
			errorMessageObject.description = entity.Player.effect + JsonReader.error.getTranslation(language).meIsDead;
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsDead, message.author)
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).meIsDead);
		}

		const timeEffect = minutesToString(millisecondsToMinutes(entity.Player.effectRemainingTime()));
		if (effect === EFFECT.SLEEPING) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsSleeping;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}

		if (effect === EFFECT.DRUNK) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsDrunk;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}
		if (effect === EFFECT.HURT) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsHurt;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}

		if (effect === EFFECT.SICK) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsSick;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}

		if (effect === EFFECT.LOCKED) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsLocked;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}
		if (effect === EFFECT.INJURED) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsInjured;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}
		if (effect === EFFECT.SCARED) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsScared;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}

		if (effect === EFFECT.OCCUPIED) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsOccupied;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}

		if (effect === EFFECT.CONFOUNDED) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsConfounded;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}

		if (effect === EFFECT.FROZEN) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsFrozen;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}
		if (effect === EFFECT.STARVING) {
			errorMessageObject.title = JsonReader.error.getTranslation(language).titleMeIsStarving;
			errorMessageObject.description = format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect});
		}

		errorMessageObject.title = errorMessageObject.title.charAt(10).toUpperCase() + errorMessageObject.title.slice(11);


		return errorMessageObject;
	}
}

global.canPerformCommand = MessageError.canPerformCommand;
global.effectsErrorMeTextValue = MessageError.effectsErrorMeTextValue;
global.effectsErrorMe = MessageError.effectsErrorMe;
