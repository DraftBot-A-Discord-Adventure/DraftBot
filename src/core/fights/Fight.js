const Fighter = require('./Fighter.js');
//const Attack = require('./Attack.js');
const FightActionResult = require('./FightActionResult.js');

/**
 * @param player1
 * @param player2
 * @param {module:"discord.js".Message} message
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {boolean} tournamentMode
 * @param {Number} maxPower
 * @param {boolean} friendly
 * @returns {Promise<void>}
 */
class Fight {


	/**
	 * @param player1
	 * @param player2
	 * @param {module:"discord.js".Message} message
	 * @param {("fr"|"en")} language - Language to use in the response
	 * @param {boolean} tournamentMode
	 * @param {Number} maxPower
	 * @param {boolean} friendly
	 * @returns {Promise<void>}
	 */
	constructor(player1, player2, message, language, tournamentMode = false, maxPower = -1, friendly = false) {
		this.fighters = [new Fighter(player2, friendly, tournamentMode), new Fighter(player1, friendly, tournamentMode)];
		this.turn = 0;
		this.message = message;
		this.language = language;
		this.tournamentMode = tournamentMode;
		this.maxPower = maxPower;
		this.friendly = friendly;
		this.lastSummary = undefined;
		this.actionMessages = undefined;
		this.endedByTime = false;
	}

	/** ******************************************************** EXTERNAL MECHANICS FUNCTIONS **********************************************************/

	/**
	 * @param {FIGHT.ACTION} action
	 */
	static actionToName(action) {
		switch (action) {
			case FIGHT.ACTION.SIMPLE_ATTACK:
				return "simple";
			case FIGHT.ACTION.QUICK_ATTACK:
				return "quick";
			case FIGHT.ACTION.ULTIMATE_ATTACK:
				return "ultimate";
			case FIGHT.ACTION.POWERFUL_ATTACK:
				return "powerful";
			case FIGHT.ACTION.BULK_ATTACK:
				return "bulk";
		}
		return "unknown";
	}

	/** ******************************************************** MESSAGE RELATED FUNCTIONS **********************************************************/

	/**
	 * Starts the fight. Is not called automatically. Also calculates stats, consume potions, block players and proceed to next turn.
	 * @return {Promise<void>}
	 */
	async startFight() {

		if (this.hasStarted()) {
			throw new Error('The fight already started !');
		} else if (this.hasEnded()) {
			throw new Error('The fight cannot be started twice !');
		}

		//load player stats
		for (let i = 0; i < this.fighters.length; i++) {
			await this.fighters[i].calculateStats();
			if (this.maxPower !== -1 && this.fighters[i].power > this.maxPower) {
				this.fighters[i].power = this.maxPower;
			}
			await this.fighters[i].consumePotionIfNeeded();
			global.addBlockedPlayer(this.fighters[i].entity.discordUser_id, 'fight');
		}

		//the player with the highest speed start the fight
		if (this.fighters[1].speed > this.fighters[0].speed) {
			let temp = this.fighters[0];
			this.fighters[0] = this.fighters[1];
			this.fighters[1] = temp;
		}

		this.introduceFight();
		this.actionMessages = [
			await this.message.channel.send('_ _'),
		];
		await this.nextTurn();
	}

	/**
	 * Send the fight intro message
	 */
	introduceFight() {
		this.message.channel.send(format(JsonReader.commands.fight.getTranslation(this.language).intro, {
			player1: this.fighters[0].entity.getMention(),
			player2: this.fighters[1].entity.getMention(),
		}));
	}

	/**
	 * Send the fight outro message
	 */
	async outroFight() {
		const loser = this.getLoser();
		const winner = this.getWinner();
		let msg;
		if (loser != null && loser.power !== winner.power) {
			msg = format(JsonReader.commands.fight.getTranslation(this.language).end.win, {
				winner: this.getWinner().entity.getMention(),
				loser: loser.entity.getMention()
			});
		} else {
			msg = format(JsonReader.commands.fight.getTranslation(this.language).end.draw, {
				player1: this.fighters[0].entity.getMention(),
				player2: this.fighters[1].entity.getMention(),
			});
		}
		msg += format(JsonReader.commands.fight.getTranslation(this.language).end.gameStats, {
			turn: this.turn,
			maxTurn: FIGHT.MAX_TURNS,
			time: minutesToString(millisecondsToMinutes(new Date().getTime() - this.message.createdTimestamp))
		});
		if (this.elo !== 0) {
			msg += format(JsonReader.commands.fight.getTranslation(this.language).end.elo, {
				elo: this.elo,
				points: this.points
			});
		}
		for (let i = 0; i < this.fighters.length; ++i) {
			let f = this.fighters[i];
			msg += format(JsonReader.commands.fight.getTranslation(this.language).end.fighterStats, {
				pseudo: await f.entity.Player.getPseudo(this.language),
				health: f.power,
				maxHealth: f.initialPower
			});
			if (Object.keys(f.attacksList).length > 0) {
				msg += JsonReader.commands.fight.getTranslation(this.language).end.attacksField;
				const attacks = JsonReader.commands.fight.getTranslation(this.language).actions.attacks;
				const attacksKeys = Object.keys(attacks);
				for (let j = 0; j < attacksKeys.length; ++j) {
					const att = f.attacksList[attacksKeys[j]];
					if (att) {
						msg += format(JsonReader.commands.fight.getTranslation(this.language).end.attackStats, {
							emote: attacks[attacksKeys[j]].emote,
							success: att ? att.success : 0,
							total: att ? att.total : 0,
							damage: att && att.success !== 0 ? Math.round((att.damage / att.success) * 10) / 10 : 0,
						});
					}
				}
			}
		}
		this.message.channel.send(new discord.MessageEmbed().setColor(JsonReader.bot.embed.default).setDescription(msg));
	}

	/**
	 * Send the turn indications in order to choose an action
	 * @return {Promise<void>}
	 */
	async sendTurnIndications() {
		const playingId = this.getPlayingFighter().entity.discordUser_id;
		const fight = this;

		const embed = new discord.MessageEmbed();
		/* embed.setThumbnail(await this.message.guild.members.cache.get(playingId).user.avatarURL())
						.setTitle(format(JsonReader.commands.fight.getTranslation(this.language).turnIndicationsTitle, {pseudo: await this.getPlayingFighter().entity.Player.getPseudo(this.language)}))
						.setDescription(JsonReader.commands.fight.getTranslation(this.language).turnIndicationsDescription);*/
		embed.setDescription(JsonReader.commands.fight.getTranslation(this.language).turnIndicationsDescription)
			.setAuthor(format(JsonReader.commands.fight.getTranslation(this.language).turnIndicationsTitle, {pseudo: await this.getPlayingFighter().entity.Player.getPseudo(this.language)}),
				await this.message.guild.members.cache.get(playingId).user.avatarURL());
		this.message.channel.send(embed)
			.then(async function (message) {
				const filter = (reaction, user) => {
					return user.id === playingId;
				};

				const collector = message.createReactionCollector(filter, {time: 30000});

				collector.on('collect', async (reaction) => {
					switch (reaction.emoji.name) {
						case '⚔':
							await message.delete().catch();
							await fight.useAction(FIGHT.ACTION.SIMPLE_ATTACK);
							break;
						case '🗡':
							await message.delete().catch();
							await fight.useAction(FIGHT.ACTION.QUICK_ATTACK);
							break;
						case '🪓':
							await message.delete().catch();
							await fight.useAction(FIGHT.ACTION.POWERFUL_ATTACK);
							break;
						case '🧨':
							await message.delete().catch();
							await fight.useAction(FIGHT.ACTION.BULK_ATTACK);
							break;
						case '🚀':
							await message.delete().catch();
							await fight.useAction(FIGHT.ACTION.IMPROVE_SPEED);
							break;
						case '💣':
							await message.delete().catch();
							await fight.useAction(FIGHT.ACTION.ULTIMATE_ATTACK);
							break;
						default:
							return;
					}
				});

				collector.on('end', () => {
					if (!message.deleted) {
						message.delete().catch();
						fight.getPlayingFighter().power = 0;
						fight.endedByTime = true;
						fight.endFight();
					}
				});

				try {
					await message.react('⚔');
					await message.react('🗡');
					await message.react('🪓');
					await message.react('💣');
					await message.react('🧨');
					await message.react('🚀');
				} catch (e) {
				}
			});
	}

	/**
	 * Get summarize embed message
	 * @param {Fight} fight
	 * @param {Fighter} attacker
	 * @param {Fighter} defender
	 * @return {Promise<{embed: {}}>}
	 */
	async getSummarizeEmbed(fight, attacker, defender) {
		return {
			embed: {
				title: JsonReader.commands.fight.getTranslation(this.language).summarize.title,
				description:
					JsonReader.commands.fight.getTranslation(this.language).summarize.intro +
					format(JsonReader.commands.fight.getTranslation(this.language).summarize.attacker, {
						pseudo: await attacker.entity.Player.getPseudo(this.language),
						charging: attacker.chargeTurns > 0 ? JsonReader.commands.fight.getTranslation(this.language).actions.chargingEmote : '',
					}) +
					format(JsonReader.commands.fight.getTranslation(this.language).summarize.stats, {
						power: attacker.power,
						attack: attacker.attack,
						defense: attacker.defense,
						speed: attacker.speed,
					}) + "\n\n" +
					format(JsonReader.commands.fight.getTranslation(this.language).summarize.defender, {
						pseudo: await defender.entity.Player.getPseudo(this.language),
						charging: defender.chargeTurns > 0 ? JsonReader.commands.fight.getTranslation(this.language).actions.chargingEmote : '',
					}) +
					format(JsonReader.commands.fight.getTranslation(this.language).summarize.stats, {
						power: defender.power,
						attack: defender.attack,
						defense: defender.defense,
						speed: defender.speed,
					}),
			},
		};
	}

	/**
	 * Summarize the fight
	 * @return {Promise<void>}
	 */
	async summarizeFight() {
		const attacker = this.getPlayingFighter();
		const defender = this.getDefendingFighter();

		if (this.lastSummary === undefined) {
			this.lastSummary = await this.message.channel.send(await this.getSummarizeEmbed(this, attacker, defender));
		} else {
			await this.lastSummary.edit(await this.getSummarizeEmbed(this, attacker, defender));
		}
	}

	/**
	 * Send the result of the action
	 * @param {FIGHT.ACTION} action
	 * @param {FightActionResult} fightActionResult
	 * @return {Promise<void>}
	 */
	async sendActionMessage(action, fightActionResult) {
		let msg = JsonReader.commands.fight.getTranslation(this.language).actions.intro;
		const player = await this.getPlayingFighter().entity.Player.getPseudo(this.language);
		let section;
		switch (action) {
			case FIGHT.ACTION.BULK_ATTACK:
				section = JsonReader.commands.fight.getTranslation(this.language).actions.attacks.bulk;
				break;
			case FIGHT.ACTION.IMPROVE_SPEED:
				await this.addActionMessage(format(msg + JsonReader.commands.fight.getTranslation(this.language).actions.speed, {
					emote: JsonReader.commands.fight.getTranslation(this.language).actions.speedEmote,
					speed: fightActionResult.speedImprovement,
					player: player,
				}));
				return;
			case FIGHT.ACTION.POWERFUL_ATTACK:
				section = JsonReader.commands.fight.getTranslation(this.language).actions.attacks.powerful;
				break;
			case FIGHT.ACTION.QUICK_ATTACK:
				section = JsonReader.commands.fight.getTranslation(this.language).actions.attacks.quick;
				break;
			case FIGHT.ACTION.SIMPLE_ATTACK:
				section = JsonReader.commands.fight.getTranslation(this.language).actions.attacks.simple;
				break;
			case FIGHT.ACTION.ULTIMATE_ATTACK:
				section = JsonReader.commands.fight.getTranslation(this.language).actions.attacks.ultimate;
				break;
			default:
				return;
		}
		let resMsg;
		if (fightActionResult.damage === 0) {
			resMsg = 'failed';
		} else if (fightActionResult.fullSuccess) {
			resMsg = 'succeed';
		} else {
			resMsg = 'notGood';
		}

		const resultSection = JsonReader.commands.fight.getTranslation(this.language).actions.attacksResults[resMsg];

		msg += resultSection[randInt(0, resultSection.length - 1)];
		await this.addActionMessage(format(msg, {
				emote: section.emote,
				player: player,
				attack: section.name,
			}) +
			format(section.end[resMsg], {ownDamages: fightActionResult.ownDamage}) +
			format(JsonReader.commands.fight.getTranslation(this.language).actions.damages, {damages: fightActionResult.damage}));
	}

	/**
	 * Add the action to an action message
	 * @param {string} msg
	 * @return {Promise<void>}
	 */
	async addActionMessage(msg) {
		let amsg = this.actionMessages[this.actionMessages.length - 1];
		if (amsg.content.length + msg.length > 1950) {
			await this.lastSummary.delete();
			this.lastSummary = undefined;
			amsg = await this.message.channel.send(msg);
			this.actionMessages.push(amsg);
		} else if (amsg.content === '_ _') {
			await amsg.edit(msg);
		} else {
			await amsg.edit(amsg.content + '\n' + msg);
		}
	}

	/** ******************************************************** INTERNAL MECHANICS FUNCTIONS **********************************************************/

	/**
	 * Scroll the messages down if needed
	 * @return {Promise<void>}
	 */
	async scrollIfNeeded() {
		const messages = await this.message.channel.messages.fetch({limit: 1});
		if (this.lastSummary !== undefined && messages.first().createdTimestamp !== this.lastSummary.createdTimestamp) {
			for (let i = 0; i < this.actionMessages.length; ++i) {
				const content = this.actionMessages[i].content;
				await this.actionMessages[i].delete();
				this.actionMessages[i] = await this.message.channel.send(content);
			}
			await this.lastSummary.delete();
			this.lastSummary = undefined;
			await this.summarizeFight();
		}
	}

	/**
	 * Proceed to next turn or end the fight if there is a loser or the max turn is reached
	 * @return {Promise<void>}
	 */
	async nextTurn() {
		this.turn++;
		if (this.getLoser() != null || this.turn >= FIGHT.MAX_TURNS) {
			this.endFight();
			return;
		}
		const playing = this.getPlayingFighter();
		if (playing.chargeTurns > -1) {
			playing.chargeTurns--;
		}
		await this.scrollIfNeeded();
		if (playing.chargeTurns === 0) {
			await this.useAction(playing.chargeAct, true);
		} else if (playing.chargeTurns > 0) {
			await this.nextTurn();
		} else {
			await this.summarizeFight();
			await this.sendTurnIndications();
		}
	}

	/**
	 * End the fight. Change fighters' score if there is a loser and unblock players
	 */
	async endFight() {
		if (!this.hasStarted()) {
			throw new Error('The fight has not started yet !');
		} else if (this.hasEnded()) {
			throw new Error('The fight already ended !');
		}
		for (let i = 0; i < this.fighters.length; ++i) {
			[this.fighters[i].entity] = await Entities.getOrRegister(this.fighters[i].entity.discordUser_id);
		}
		const loser = this.getLoser();
		const winner = this.getWinner();
		this.calculateElo();
		this.calculatePoints();

		// give and remove points if the fight is not a draw
		if (loser != null && loser.power !== winner.power) {
			loser.entity.Player.addScore(-this.points);
			loser.entity.Player.addWeeklyScore(-this.points);
			loser.entity.Player.save();
			winner.entity.Player.addScore(this.points);
			winner.entity.Player.addWeeklyScore(this.points);
			winner.entity.Player.save();
		}

		if (!this.friendly && !this.tournamentMode) {
			for (let i = 0; i < this.fighters.length; i++) {
				this.fighters[i].entity.fightPointsLost = await this.fighters[i].entity.getMaxCumulativeHealth() - this.fighters[i].power;
				this.fighters[i].entity.save();
			}
		}
		for (let i = 0; i < this.fighters.length; i++) {
			global.removeBlockedPlayer(this.fighters[i].entity.discordUser_id);
		}
		if (this.lastSummary !== undefined) {
			this.lastSummary.delete({timeout: 5000}).catch();
		}
		if (winner != null) {
			log("Fight ended; winner: " + winner.entity.discordUser_id + " (" + winner.power + "/" + winner.initialPower + "); loser: " + loser.entity.discordUser_id + " (" + loser.power + "/" + loser.initialPower + "); turns: " + this.turn + "; points won/lost: " + this.points + "; ended by time off: " + this.endedByTime);
		} else {
			log("Fight ended; egality: " + this.fighters[0].entity.discordUser_id + " (" + this.fighters[0].power + "/" + this.fighters[0].initialPower + "); loser: " + this.fighters[1].entity.discordUser_id + " (" + this.fighters[1].power + "/" + this.fighters[1].initialPower + "); turns: " + this.turn + "; points won/lost: " + this.points + "; ended by time off: " + this.endedByTime);
		}
		this.outroFight();
		this.turn = -1;
	}

	/**
	 * Makes the playing fighter use an action
	 * @param {FIGHT.ACTION} action
	 * @param {Boolean} charged If used after a charge
	 * @return {Promise<void>}
	 */
	async useAction(action, charged = false) {
		const success = draftbotRandom.realZeroToOneInclusive();
		const attacker = this.getPlayingFighter();
		const defender = this.getDefendingFighter();
		const far = new FightActionResult();
		let powerChanger;

		switch (action) {
			case FIGHT.ACTION.QUICK_ATTACK:
				// maybe used for future refactor
				//let test = await getAttack(FIGHT.ACTION.QUICK_ATTACK);
				//test(success, attacker, defender);

				powerChanger = 0.1;
				if (defender.speed > attacker.speed && success < 0.3) {
					powerChanger = 0.85;
					if (attacker.quickAttack > 1)
						powerChanger -= attacker.quickAttack / 15;
					attacker.quickAttack++;
				} else if (defender.speed < attacker.speed && success < 0.98) {
					powerChanger = 0.85;
					if (attacker.quickAttack > 1)
						powerChanger -= attacker.quickAttack / 11;
					attacker.quickAttack++;
				}
				far.damage = Math.round(attacker.attack * powerChanger - Math.round(defender.defense * 0.1));
				far.fullSuccess = far.damage >= attacker.attack - defender.power;
				break;

			case FIGHT.ACTION.SIMPLE_ATTACK:
				powerChanger = 0.4;
				if ((defender.speed > attacker.speed && success <= 0.4) || (defender.speed < attacker.speed && success < 0.9)) {
					powerChanger = 1.2;
				} else if ((defender.speed > attacker.speed && success <= 0.9)) {
					powerChanger = 0.9;
				}
				far.damage = Math.round(attacker.attack * powerChanger - defender.defense);
				if (far.damage < 0)
					far.damage = 0;
				far.damage += randInt(1, Math.round(attacker.attack / 4));
				far.fullSuccess = far.damage >= Math.round(attacker.attack / 4);
				break;

			case FIGHT.ACTION.POWERFUL_ATTACK:
				powerChanger = 0.0;
				if ((defender.speed > attacker.speed && success <= 0.2) || (defender.speed < attacker.speed && success < 0.7)) {
					powerChanger = 2.15;
				} else if ((defender.speed > attacker.speed && success <= 0.5) || (defender.speed < attacker.speed && success < 0.9)) {
					powerChanger = 1.4;
				}
				if (powerChanger > 1) {
					attacker.speed = Math.round(attacker.speed * 0.75);
				} else {
					attacker.speed = Math.round(attacker.speed * 0.9);
				}
				far.damage = Math.round(attacker.attack * powerChanger - Math.round(defender.defense * 1.5));
				if (far.damage < 0)
					far.damage = 0;
				if (powerChanger > 1)
					far.damage += randInt(0, Math.round(attacker.attack / 2));
				far.fullSuccess = powerChanger > 1.4;
				break;

			case FIGHT.ACTION.BULK_ATTACK:
				if (success < 0.9) {
					far.damage = Math.round(attacker.attack * 2.5 - Math.round(defender.defense));
					far.ownDamage = Math.round(attacker.attack * 2.5 - Math.round(attacker.defense));
					if (far.ownDamage < 10)
						far.ownDamage = 10;
					attacker.power -= far.ownDamage; //this attack is for everybody
					if (attacker.power < 0)
						attacker.power = 0;
				} else {
					far.damage = 0;
				}
				far.fullSuccess = far.damage > 0;
				break;

			case FIGHT.ACTION.IMPROVE_SPEED:
				far.speedImprovement = attacker.improveSpeed();
				break;

			case FIGHT.ACTION.ULTIMATE_ATTACK:
				if (!charged) {
					await this.addActionMessage(format(JsonReader.commands.fight.getTranslation(this.language).actions.intro + JsonReader.commands.fight.getTranslation(this.language).actions.charging, {
						emote: JsonReader.commands.fight.getTranslation(this.language).actions.chargingEmote,
						player: await attacker.entity.Player.getPseudo(this.language),
					}));
					attacker.chargeAction(FIGHT.ACTION.ULTIMATE_ATTACK, 1);
					attacker.defense = Math.round(attacker.defense * 0.60);
					await this.nextTurn();
					return;
				}
				if ((success <= 0.1) || (attacker.power < attacker.initialPower * 0.5 && success <= 0.8) || (attacker.power < attacker.initialPower * 0.25)) {
					far.damage = Math.round(attacker.attack * 3.5 - Math.round(defender.defense));
					if(far.damage > defender.initialPower * 0.6)
						far.damage = Math.round(defender.initialPower * 0.6);

					far.fullSuccess = true;
				} else {
					far.damage = 0;
					far.fullSuccess = false;
				}
				break;

			default:
				return;
		}
		let actionName = Fight.actionToName(action);
		if (!attacker.attacksList[actionName]) {
			attacker.attacksList[actionName] = {
				success: 0,
				total: 0,
				damage: 0
			};
		}
		let stats = attacker.attacksList[actionName];
		stats.total++;
		if (far.damage > 0) {
			stats.success++;
			stats.damage += far.damage;
			defender.power -= far.damage;
			if (defender.power < 0) {
				defender.power = 0;
			}
		} else {
			far.damage = 0;
		}
		await this.sendActionMessage(action, far);
		await this.nextTurn();
	}

	/**
	 * Calculate elo of the fight and set the attribute elo
	 */
	calculateElo() {
		const loser = this.getLoser();
		const winner = this.getWinner();
		if (loser !== null && winner !== null && winner.entity.Player.score !== 0 && !this.tournamentMode && !this.friendly) {
			this.elo = Math.round((loser.entity.Player.score / winner.entity.Player.score) * 100) / 100;
		} else {
			this.elo = 0;
		}
	}

	/** ******************************************************** GETTERS **********************************************************/

	/**
	 * Calculate points of the fight based on elo and set the attribute points
	 */
	calculatePoints() {
		const loser = this.getLoser();
		if (loser !== null && !this.tournamentMode && !this.friendly) {
			this.points = Math.round(100 + 10 * loser.entity.Player.level * this.elo);
			if (this.points > 2000) {
				this.points = Math.round(2000 - randInt(5, 1000));
			}
		} else {
			this.points = 0;
		}
	}

	/**
	 * @return {boolean}
	 */
	hasStarted() {
		return this.turn !== 0;
	}

	/**
	 * @return {boolean}
	 */
	hasEnded() {
		return this.turn === -1;
	}

	/**
	 * @return {boolean} If the fight is currently running
	 */
	isRunning() {
		return this.hasStarted() && !this.hasEnded();
	}

	/**
	 * Get the playing fighter or null if the fight is not running
	 * @return {Fighter|null}
	 */
	getPlayingFighter() {
		return this.isRunning() ? this.fighters[(this.turn - 1) % 2] : null;
	}

	/**
	 * Get the defending fighter or null if the fight is not running
	 * @return {Fighter|null}
	 */
	getDefendingFighter() {
		return this.isRunning() ? this.fighters[this.turn % 2] : null;
	}

	/**
	 * Get the loser of the fight or null if there is none
	 * @return {null|Fighter}
	 */
	getLoser() {
		for (let i = 0; i < this.fighters.length; ++i) {
			if (this.fighters[i].power <= 0) {
				return this.fighters[i];
			}
		}
		return null;
	}

	/**
	 * Get the winner of the fight or null if there is none
	 * @return {null|Fighter}
	 */
	getWinner() {
		const loser = this.getLoser();
		if (loser == null) {
			return null;
		}
		return loser === this.fighters[0] ? this.fighters[1] : this.fighters[0];
	}

	/**
	 * @return {number}
	 */
	getTurn() {
		return this.turn;
	}
}

module.exports = Fight;
