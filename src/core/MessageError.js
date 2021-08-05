import {DraftBotEmbed} from "./messages/DraftBotEmbed";

class MessageError {
	/**
	 * @param {module:"discord.js".Message} message - Message from the discord server
	 * @param {String} permission
	 * @param {("fr"|"en")} language
	 * @param {String[]} disallowEffects
	 * @param {Entities} entity
	 * @param {number} minimalLevel
	 * @return {Promise<any>}
	 */
	static async canPerformCommand(message, language, permission) {
		if (permission === PERMISSION.ROLE.BADGE_MANAGER) {
			if (!message.member.roles.cache.has(JsonReader.app.BADGE_MANAGER_ROLE) && !MessageError.isBotOwner(message.author.id)) {
				return await MessageError.permissionErrorMe(message, language, permission);
			}
		}

		if (permission === PERMISSION.ROLE.CONTRIBUTORS) {
			if (!message.member.roles.cache.has(JsonReader.app.CONTRIBUTOR_ROLE) && !MessageError.isBotOwner(message.author.id)) {
				return await MessageError.permissionErrorMe(message, language, permission);
			}
		}

		if (permission === PERMISSION.ROLE.SUPPORT) {
			if (!message.member.roles.cache.has(JsonReader.app.SUPPORT_ROLE) && !MessageError.isBotOwner(message.author.id)) {
				return await MessageError.permissionErrorMe(message, language, permission);
			}
		}

		if (permission === PERMISSION.ROLE.ADMINISTRATOR) {
			if (!message.member.hasPermission("ADMINISTRATOR") && !MessageError.isBotOwner(message.author.id)) {
				return await MessageError.permissionErrorMe(message, language, permission);
			}
		}

		if (permission === PERMISSION.ROLE.BOT_OWNER) {
			if (!MessageError.isBotOwner(message.author.id)) {
				return await MessageError.permissionErrorMe(message, language, permission);
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
	 * @param {module:"discord.js".Message} message - Message from the discord server
	 * @param {("fr"|"en")} language
	 * @param {String} permission
	 * @return {Promise<Message>}
	 */
	static async permissionErrorMe(message, language, permission) {
		const embed = new DraftBotEmbed()
			.setErrorColor()
			.formatAuthor(JsonReader.error.getTranslation(language).titlePermissionError, message.author);

		if (permission === PERMISSION.ROLE.BADGE_MANAGER) {
			embed.setDescription(JsonReader.error.getTranslation(language).badgeManagerPermissionMissing);
		}

		if (permission === PERMISSION.ROLE.CONTRIBUTORS) {
			embed.setDescription(JsonReader.error.getTranslation(language).contributorPermissionMissing);
		}

		if (permission === PERMISSION.ROLE.SUPPORT) {
			embed.setDescription(JsonReader.error.getTranslation(language).dmSupportPermissionMissing);
		}

		if (permission === PERMISSION.ROLE.ADMINISTRATOR) {
			embed.setDescription(JsonReader.error.getTranslation(language).administratorPermissionMissing);
		}

		if (permission === PERMISSION.ROLE.BOT_OWNER) {
			embed.setDescription(JsonReader.error.getTranslation(language).botOwnerPermissionMissing);
		}

		return await message.channel.send(embed);
	}

	/**
	 * @param {module:"discord.js".Message} message - Message from the discord server
	 * @param {("fr"|"en")} language
	 * @param {Entities} entity
	 * @param {String} effect
	 * @return {Promise<Message>}
	 */
	static async effectsErrorMe(message, language, entity, effect) {

		const embed = new DraftBotEmbed().setErrorColor();

		if (effect === EFFECT.SMILEY) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsFine, message.author)
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).notPossibleWithoutStatus);
		}

		if (effect === EFFECT.BABY) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsBaby, message.author)
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).meIsBaby);
		}

		if (effect === EFFECT.DEAD) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsDead, message.author)
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).meIsDead);
		}

		const timeEffect = minutesToString(millisecondsToMinutes(entity.Player.effectRemainingTime()));
		if (effect === EFFECT.SLEEPING) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsSleeping, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.DRUNK) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsDrunk, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}
		if (effect === EFFECT.HURT) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsHurt, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.SICK) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsSick, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.LOCKED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsLocked, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWait, {time: timeEffect}));
		}
		if (effect === EFFECT.INJURED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsInjured, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}
		if (effect === EFFECT.SCARED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsScared, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.OCCUPIED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsOccupied, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.CONFOUNDED) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsConfounded, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.FROZEN) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsFrozen, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}
		if (effect === EFFECT.STARVING) {
			embed
				.formatAuthor(JsonReader.error.getTranslation(language).titleMeIsStarving, message.author)
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		return await message.channel.send(embed);
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
