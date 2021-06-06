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
	static async canPerformCommand(message, language, permission, disallowEffects = null, entity = null, minimalLevel = null) {
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

		if (permission === PERMISSION.ROLE.TOURNAMENT) {
			if (!message.member.roles.cache.has(JsonReader.app.TOURNAMENT_ROLE) && !MessageError.isBotOwner(message.author.id)) {
				return await MessageError.permissionErrorMe(message, language, permission);
			}
		}

		// Check disallowEffects on entity
		if (disallowEffects === null) {
			return true;
		}
		const disallowEffect = disallowEffects.indexOf(entity.Player.effect);
		if (disallowEffect !== -1) {
			if (message.author.id === entity.discordUser_id) {
				if (!entity.Player.currentEffectFinished()) {
					return await MessageError.effectsErrorMe(message, language, entity, disallowEffects[disallowEffect]);
				}
			} else {
				return await MessageError.errorPlayer(message, language, entity.Player);
			}
		}

		if (minimalLevel !== null) {
			if (entity.Player.level < minimalLevel) {
				return await sendErrorMessage(
					message.author,
					message.channel,
					language,
					format(JsonReader.error.getTranslation(language).levelTooLow, {
						pseudo: entity.getMention(),
						level: minimalLevel
					})
				);
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
		const embed = new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.error);

		if (permission === PERMISSION.ROLE.BADGE_MANAGER) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(JsonReader.error.getTranslation(language).badgeManagerPermissionMissing);
		}

		if (permission === PERMISSION.ROLE.CONTRIBUTORS) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(JsonReader.error.getTranslation(language).contributorPermissionMissing);
		}

		if (permission === PERMISSION.ROLE.SUPPORT) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(JsonReader.error.getTranslation(language).dmSupportPermissionMissing);
		}

		if (permission === PERMISSION.ROLE.ADMINISTRATOR) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(JsonReader.error.getTranslation(language).administratorPermissionMissing);
		}

		if (permission === PERMISSION.ROLE.BOT_OWNER) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(JsonReader.error.getTranslation(language).botOwnerPermissionMissing);
		}

		if (permission === PERMISSION.ROLE.TOURNAMENT) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titlePermissionError, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(JsonReader.error.getTranslation(language).botTournamentPermissionMissing);
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

		const embed = new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.error);

		if (effect === EFFECT.SMILEY) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsFine, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).notPossibleWithoutStatus);
		}

		if (effect === EFFECT.BABY) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsBaby, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).meIsBaby);
		}

		if (effect === EFFECT.DEAD) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsDead, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(entity.Player.effect + JsonReader.error.getTranslation(language).meIsDead);
		}

		const timeEffect = minutesToString(millisecondsToMinutes(entity.Player.effectRemainingTime()));
		if (effect === EFFECT.SLEEPING) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsSleeping, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.DRUNK) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsDrunk, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}
		if (effect === EFFECT.HURT) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsHurt, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.SICK) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsSick, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.LOCKED) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsLocked, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWait, {time: timeEffect}));
		}
		if (effect === EFFECT.INJURED) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsInjured, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}
		if (effect === EFFECT.SCARED) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsScared, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.OCCUPIED) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsOccupied, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.CONFOUNDED) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsConfounded, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		if (effect === EFFECT.FROZEN) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsFrozen, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}
		if (effect === EFFECT.STARVING) {
			embed
				.setAuthor(format(JsonReader.error.getTranslation(language).titleMeIsStarving, {pseudo: message.author.username}), message.author.displayAvatarURL())
				.setDescription(format(entity.Player.effect + JsonReader.error.getTranslation(language).pleaseWaitForHeal, {time: timeEffect}));
		}

		return await message.channel.send(embed);
	}

	/**
	 * Handle error if needed
	 */
	static async errorPlayer(message, language, player) {
		const embed = new discord.MessageEmbed()
			.setColor(JsonReader.bot.embed.error)
			.setAuthor(format(JsonReader.error.getTranslation(language).title[0], {pseudo: message.author.username}), message.author.displayAvatarURL());

		if (player.effect === EFFECT.BABY) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsBaby, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.DEAD) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsDead, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.SLEEPING) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsSleeping, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.DRUNK) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsDrunk, {
					askedPseudo: await player.getPseudo(language),
				}));
		}
		if (player.effect === EFFECT.HURT) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsHurt, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.SICK) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsSick, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.LOCKED) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsLocked, {
					askedPseudo: await player.getPseudo(language),
				}));
		}
		if (player.effect === EFFECT.INJURED) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsInjured, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.SCARED) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsScared, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.OCCUPIED) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsOccupied, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.CONFOUNDED) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsCondounded, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.STARVING) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsStarving, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		if (player.effect === EFFECT.FROZEN) {
			embed
				.setDescription(format(JsonReader.error.getTranslation(language).playerIsFrozen, {
					askedPseudo: await player.getPseudo(language),
				}));
		}

		return await message.channel.send(embed);
	}
}

global.canPerformCommand = MessageError.canPerformCommand;
global.errorMe = MessageError.errorMe;
global.errorPlayer = MessageError.errorPlayer;
global.effectsErrorMe = MessageError.effectsErrorMe;
