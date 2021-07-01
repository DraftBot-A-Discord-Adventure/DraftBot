const Fight = require("../../core/fights/Fight");

module.exports.help = {
	name: "fight",
	aliases: ["f"],
	disallowEffects: [EFFECT.BABY, EFFECT.DEAD, EFFECT.LOCKED],
	requiredLevel: FIGHT.REQUIRED_LEVEL
};

/**
 * Displays information about the profile of the player who sent the command
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @param {boolean} friendly - If the fight is a friendly fight
 */
const FightCommand = async function(message, language, args, friendly = false) {
	const [attacker] = await Entities.getOrRegister(message.author.id);

	if (await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], attacker) !== true) {
		return;
	}

	let defender = null;
	if (args.length !== 0) {
		[defender] = await Entities.getByArgs(args, message);
		if (defender === null) {
			sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.defenderDoesntExist);
			return;
		}
		else if (defender.discordUserId === attacker.discordUserId) {
			sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.fightHimself);
			return;
		}
	}

	let canF;
	if ((canF = await canFight(attacker, friendly, friendly)) !== FIGHT_ERROR.NONE) {
		sendError(message, attacker, canF, true, language);
		return;
	}
	if (defender !== null && (canF = await canFight(defender, friendly, friendly)) !== FIGHT_ERROR.NONE) {
		sendError(message, defender, canF, false, language);
		return;
	}

	let msg;
	let spamCount = 0;
	const spammers = [];
	await global.addBlockedPlayer(attacker.discordUserId, "fight");

	if (defender === null) {
		msg = format(JsonReader.commands.fight.getTranslation(language).wantsToFightAnyone, {
			friendly: friendly ? JsonReader.commands.fight.getTranslation(language).friendly : "",
			player: attacker.getMention()
		});
	}
	else {
		msg = format(JsonReader.commands.fight.getTranslation(language).wantsToFightSomeone, {
			friendly: friendly ? JsonReader.commands.fight.getTranslation(language).friendly : "",
			player: attacker.getMention(),
			opponent: defender.getMention()
		});
	}
	msg += "\n\n" + await getStatsDisplay(attacker, language, friendly);
	if (defender !== null) {
		msg += "\n" + await getStatsDisplay(defender, language, friendly);
	}

	await message.channel.send(msg)
		.then(async function(messageFightAsk) {
			await messageFightAsk.react(MENU_REACTION.ACCEPT);
			await messageFightAsk.react(MENU_REACTION.DENY);

			let filter, fightInstance;
			if (defender === null) {
				filter = (_, user) => !user.bot;
			}
			else {
				filter = (_, user) => user.id === attacker.discordUserId || user.id === defender.discordUserId;
			}

			const collector = messageFightAsk.createReactionCollector(filter, {time: 60000});

			collector.on("collect", async (reaction, user) => {
				switch (reaction.emoji.name) {
				case MENU_REACTION.ACCEPT:
					if (user.id === attacker.discordUserId) {
						spamCount++;
						if (spamCount < 3) {
							await sendErrorMessage(user, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.fightHimself);
							return;
						}
						await sendErrorMessage(user, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.spamCanceled);
						fightInstance = null;
						break;
					}
					[defender] = await Entities.getOrRegister(user.id);
					if ((canF = await canFight(defender, friendly , friendly)) !== FIGHT_ERROR.NONE) {
						sendError(message, defender, canF, true, language);
						defender = null;
						return;
					}
					fightInstance = new Fight(attacker, defender, message, language, friendly);
					await fightInstance.startFight();
					log("Fight (friendly: " + friendly + ") started in server "
							+ message.guild.id + " between " + attacker.discordUserId + " (" + await attacker.getCumulativeHealth() + "/" + await attacker.getMaxCumulativeHealth() + ") and "
							+ defender.discordUserId + " (" + await defender.getCumulativeHealth() + "/" + await defender.getMaxCumulativeHealth() + ")");
					break;
				case MENU_REACTION.DENY:
					if (user.id === attacker.discordUserId) {
						await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.canceled, true);
					}
					else if (defender !== null) {
						await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.opponentNotAvailable);
					}
					else {
						if (spammers.includes(user.id)) {
							return;
						}
						spammers.push(user.id);
						await sendErrorMessage(user, message.channel, language, format(JsonReader.commands.fight.getTranslation(language).error.onlyInitiator, {pseudo: "<@" + user.id + ">"}));
						return;
					}
					fightInstance = null;
					break;
				default:
					return;
				}
				collector.stop();
			});

			collector.on("end", async function() {
				if (fightInstance === undefined) {
					global.removeBlockedPlayer(attacker.discordUserId);
					if (defender === null) {
						await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.noOneAvailable);
					}
					else {
						await sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.opponentNotAvailable);
					}
				}
				if (fightInstance === null) {
					global.removeBlockedPlayer(attacker.discordUserId);
				}
			});
		});
};

/**
 * Send a message error
 * @param {module:"discord.js".Message} message
 * @param entity
 * @param {FIGHT_ERROR} error
 * @param {Boolean} direct If the error is caused by the entity itself
 * @param {"fr"|"en"} language
 */
function sendError(message, entity, error, direct, language) {
	let msg;
	switch (error) {
	case FIGHT_ERROR.WRONG_LEVEL:
		msg = direct ?
			format(JsonReader.commands.fight.getTranslation(language).error.levelTooLow.direct, {
				pseudo: entity.getMention(),
				level: FIGHT.REQUIRED_LEVEL
			}) :
			format(JsonReader.commands.fight.getTranslation(language).error.levelTooLow.indirect, {level: FIGHT.REQUIRED_LEVEL});
		sendErrorMessage(message.guild.members.cache.get(entity.discordUserId).user, message.channel, language, msg);
		break;
	case FIGHT_ERROR.DISALLOWED_EFFECT:
		msg = direct ?
			format(JsonReader.commands.fight.getTranslation(language).error.cantFightStatus.direct, {pseudo: entity.getMention()}) :
			JsonReader.commands.fight.getTranslation(language).error.cantFightStatus.indirect;
		break;
	case FIGHT_ERROR.OCCUPIED:
		msg = direct ?
			format(JsonReader.commands.fight.getTranslation(language).error.occupied.direct, {pseudo: entity.getMention()}) :
			JsonReader.commands.fight.getTranslation(language).error.occupied.indirect;
		break;
	case FIGHT_ERROR.NO_FIGHT_POINTS:
		msg = direct ?
			format(JsonReader.commands.fight.getTranslation(language).error.noFightPoints.direct, {pseudo: entity.getMention()}) :
			JsonReader.commands.fight.getTranslation(language).error.noFightPoints.indirect;
		break;
	default:
		return;
	}
	sendErrorMessage(message.guild.members.cache.get(entity.discordUserId).user, message.channel, language, msg);
}

/**
 * @param entity
 * @param {boolean} bypassAlteration
 * @param {boolean} bypassHealth
 * @return {Number} error
 */
async function canFight(entity, bypassAlteration, bypassHealth) {
	if (entity === null) {
		return null;
	}
	if (entity.Player.level < FIGHT.REQUIRED_LEVEL) {
		return FIGHT_ERROR.WRONG_LEVEL;
	}
	if (!entity.Player.currentEffectFinished() && !bypassAlteration) {
		return FIGHT_ERROR.DISALLOWED_EFFECT;
	}
	if (global.hasBlockedPlayer(entity.discordUserId)) {
		return FIGHT_ERROR.OCCUPIED;
	}
	if (await entity.getCumulativeHealth() === 0 && !bypassHealth) {
		return FIGHT_ERROR.NO_FIGHT_POINTS;
	}
	return 0;
}

/**
 * Returns the message which displays the stats of a player under the fight ask
 * @param {Entities} entity
 * @param {"fr"|"en"} language
 * @param {boolean} friendly
 * @return {Promise<String>}
 */
async function getStatsDisplay(entity, language, friendly = false) {
	let msg = format(JsonReader.commands.fight.getTranslation(language).statsOfPlayer, {pseudo: await entity.Player.getPseudo(language)});
	const inv = entity.Player.Inventory;
	const w = await inv.getWeapon();
	const a = await inv.getArmor();
	const p = await inv.getPotion();
	if (friendly) {
		p.power = 0;
	}
	const o = await inv.getActiveObject();

	msg += format(JsonReader.commands.fight.getTranslation(language).summarize.stats, {
		power: await entity.getCumulativeHealth(),
		attack: await entity.getCumulativeAttack(w, a, p, o),
		defense: await entity.getCumulativeDefense(w, a, p, o),
		speed: await entity.getCumulativeSpeed(w, a, p, o)
	});
	return msg;
}

const FIGHT_ERROR = {
	NONE: 0,
	WRONG_LEVEL: 1,
	DISALLOWED_EFFECT: 2,
	OCCUPIED: 3,
	NO_FIGHT_POINTS: 4
};

module.exports.execute = FightCommand;
