const Fight = require('../../core/Fight');

/**
 * Displays information about the profile of the player who sent the command
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @param {boolean} friendly - If the fight is a friendly fight
 */
const FightCommand = async function (language, message, args, friendly = false) {
	let attacker;
	[attacker] = await Entities.getOrRegister(message.author.id);

	if ((await canPerformCommand(message, language, PERMISSION.ROLE.ALL, [EFFECT.BABY, EFFECT.DEAD], attacker)) !== true) {
		return;
	}

	/*let ftmp = new Fight(attacker, attacker, message, language); //Fight for testing
	return ftmp.startFight();*/

	let defender = null;
	if (args.length !== 0) {
		[defender] = await Entities.getByArgs(args, message);
		if (defender == null) {
			sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.defenderDoesntExist);
			return;
		} else if (defender.discordUser_id === attacker.discordUser_id) {
			sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.fightHimself);
			return;
		}
	}

	let isTournament = tournamentChannel === message.channel.id && !friendly;
	let canF;
	if ((canF = await canFight(attacker, isTournament, friendly || isTournament)) !== FIGHT_ERROR.NONE) {
		sendError(message, attacker, canF, true, language);
		return;
	}
	if (defender != null && (canF = await canFight(defender, isTournament, friendly || isTournament)) !== FIGHT_ERROR.NONE) {
		sendError(message, defender, canF, false, language);
		return;
	}

	let msg;
	let spamCount = 0;
	let spammers = [];
	global.addBlockedPlayer(attacker.discordUser_id, 'fight');

	if (defender == null) {
		msg = format(JsonReader.commands.fight.getTranslation(language).wantsToFightAnyone, {
			friendly: friendly ? JsonReader.commands.fight.getTranslation(language).friendly : "",
			player: attacker.getMention()
		});
	} else {
		msg = format(JsonReader.commands.fight.getTranslation(language).wantsToFightSomeone, {
			friendly: friendly ? JsonReader.commands.fight.getTranslation(language).friendly : "",
			player: attacker.getMention(),
			opponent: defender.getMention(),
		});
	}
	msg += "\n\n" + await getStatsDisplay(attacker, language, isTournament ? tournamentPower : -1, friendly || isTournament);
	if (defender !== null) {
		msg += "\n" + await getStatsDisplay(defender, language, isTournament ? tournamentPower : -1, friendly || isTournament);
	}

	await message.channel.send(msg)
		.then(async function (messageFightAsk) {
			await messageFightAsk.react('✅');
			await messageFightAsk.react('❌');

			let filter;
			if (defender == null) {
				filter = (reaction, user) => {
					return !user.bot;
				};
			} else {
				filter = (reaction, user) => {
					return user.id === attacker.discordUser_id || user.id === defender.discordUser_id;
				};
			}

			const collector = messageFightAsk.createReactionCollector(filter, {time: 120000});

			collector.on('collect', async (reaction, user) => {
				switch (reaction.emoji.name) {
					case '✅':
						if (user.id === attacker.discordUser_id) {
							spamCount++;
							if (spamCount < 3) {
								sendErrorMessage(user, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.fightHimself);
								return;
							}
							sendErrorMessage(user, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.spamCanceled);
							fightInstance = null;
							break;
						}
						[defender] = await Entities.getOrRegister(user.id);
						if ((canF = await canFight(defender, isTournament, friendly || isTournament)) !== FIGHT_ERROR.NONE) {
							sendError(message, defender, canF, true, language);
							defender = null;
							return;
						}
						fightInstance = new Fight(attacker, defender, message, language, isTournament, isTournament ? tournamentPower : -1, friendly);
						fightInstance.startFight();
						log("Fight (tournament: " + isTournament + "; friendly: " + friendly + ") started in server " + message.guild.id + " between " + attacker.discordUser_id + " (" + await attacker.getCumulativeHealth() + "/" + await attacker.getMaxCumulativeHealth() + ") and " + defender.discordUser_id + " (" + await defender.getCumulativeHealth() + "/" + await defender.getMaxCumulativeHealth() + ")");
						break;
					case '❌':
						if (user.id === attacker.discordUser_id) {
							await message.channel.send(JsonReader.commands.fight.getTranslation(language).error.canceled);
						} else if (defender != null) {
							sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.opponentNotAvailable);
						} else {
							if (spammers.includes(user.id)) {
								return;
							}
							spammers.push(user.id);
							sendErrorMessage(user, message.channel, language, format(JsonReader.commands.fight.getTranslation(language).error.onlyInitiator, {pseudo: '<@' + user.id + '>'}));
							return;
						}
						fightInstance = null;
						break;
					default:
						return;
				}
				collector.stop();
			});

			collector.on('end', async function () {
				if (fightInstance === undefined) {
					global.removeBlockedPlayer(attacker.discordUser_id);
					if (defender == null) {
						sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.noOneAvailable);
					} else {
						sendErrorMessage(message.author, message.channel, language, JsonReader.commands.fight.getTranslation(language).error.opponentNotAvailable);
					}
				}
				if (fightInstance == null) {
					global.removeBlockedPlayer(attacker.discordUser_id);
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
	switch (error) {
		case FIGHT_ERROR.WRONG_LEVEL:
			const msg = direct ?
				format(JsonReader.commands.fight.getTranslation(language).error.levelTooLow.direct, {
					pseudo: entity.getMention(),
					level: FIGHT.REQUIRED_LEVEL
				}) :
				format(JsonReader.commands.fight.getTranslation(language).error.levelTooLow.indirect, {level: FIGHT.REQUIRED_LEVEL});
			sendErrorMessage(message.guild.members.cache.get(entity.discordUser_id).user, message.channel, language, msg);
			break;
		case FIGHT_ERROR.DISALLOWED_EFFECT:
			const msg1 = direct ?
				format(JsonReader.commands.fight.getTranslation(language).error.cantFightStatus.direct, {pseudo: entity.getMention()}) :
				JsonReader.commands.fight.getTranslation(language).error.cantFightStatus.indirect;
			sendErrorMessage(message.guild.members.cache.get(entity.discordUser_id).user, message.channel, language, msg1);
			break;
		case FIGHT_ERROR.OCCUPIED:
			const msg2 = direct ?
				format(JsonReader.commands.fight.getTranslation(language).error.occupied.direct, {pseudo: entity.getMention()}) :
				JsonReader.commands.fight.getTranslation(language).error.occupied.indirect;
			sendErrorMessage(message.guild.members.cache.get(entity.discordUser_id).user, message.channel, language, msg2);
			break;
		case FIGHT_ERROR.NO_FIGHT_POINTS:
			const msg3 = direct ?
				format(JsonReader.commands.fight.getTranslation(language).error.noFightPoints.direct, {pseudo: entity.getMention()}) :
				JsonReader.commands.fight.getTranslation(language).error.noFightPoints.indirect;
			sendErrorMessage(message.guild.members.cache.get(entity.discordUser_id).user, message.channel, language, msg3);
			break;
		default:
			break;
	}
}

/**
 * @param entity
 * @param {boolean} bypassAlteration
 * @param {boolean} bypassHealth
 * @return {Number} error
 */
async function canFight(entity, bypassAlteration, bypassHealth) {
	if (entity == null) {
		return null;
	}
	if (entity.Player.level < FIGHT.REQUIRED_LEVEL) {
		return FIGHT_ERROR.WRONG_LEVEL;
	}
	if (!entity.currentEffectFinished() && !bypassAlteration) {
		return FIGHT_ERROR.DISALLOWED_EFFECT;
	}
	if (global.hasBlockedPlayer(entity.discordUser_id)) {
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
 * @param {Number} maxPower
 * @param {boolean} friendly
 * @return {Promise<String>}
 */
async function getStatsDisplay(entity, language, maxPower = -1, friendly = false) {
	let msg = format(JsonReader.commands.fight.getTranslation(language).statsOfPlayer, {pseudo: await entity.Player.getPseudo(language)});
	let inv = entity.Player.Inventory;
	let w = await inv.getWeapon();
	let a = await inv.getArmor();
	let p = await inv.getPotion();
	if (friendly) {
		p.power = 0;
	}
	let o = await inv.getActiveObject();
	let power = maxPower;
	const pMaxPower = await entity.getMaxCumulativeHealth();
	if (power === -1 || pMaxPower < maxPower) {
		power = friendly ? pMaxPower : await entity.getCumulativeHealth();
	}
	msg += format(JsonReader.commands.fight.getTranslation(language).summarize.stats, {
		power: power,
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

/**
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 */
const FriendlyFightCommand = async function (language, message, args) {
	await FightCommand(language, message, args, true);
};

module.exports = {
	commands: [
		{
			name: 'fight',
			func: FightCommand,
			aliases: ['f']
		},
		{
			name: 'friendlyfight',
			func: FriendlyFightCommand,
			aliases: ['ffight', 'ff']
		}
	]
};
