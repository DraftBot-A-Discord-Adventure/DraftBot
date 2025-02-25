import {FightController} from "./FightController";
import {Fighter} from "./fighter/Fighter";
import {DraftBotPacket, makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {PlayerFighter} from "./fighter/PlayerFighter";
import {MonsterFighter} from "./fighter/MonsterFighter";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";
import {CommandFightIntroduceFightersPacket} from "../../../../Lib/src/packets/fights/FightIntroductionPacket";
import {CommandFightStatusPacket} from "../../../../Lib/src/packets/fights/FightStatusPacket";
import {FightAction} from "../../data/FightAction";
import {FightActionResult, FightStatBuffed} from "../../../../Lib/src/types/FightActionResult";
import {CommandFightHistoryItemPacket} from "../../../../Lib/src/packets/fights/FightHistoryItemPacket";
import {FightStatModifierOperation} from "../../../../Lib/src/types/FightStatModifierOperation";
import {toSignedPercent} from "../../../../Lib/src/utils/StringUtils";
import {FightAlterationResult} from "../../../../Lib/src/types/FightAlterationResult";

/* eslint-disable capitalized-comments */

/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @class FightController
 */
export class FightView {

	public context: PacketContext;

	fightController: FightController;

	public constructor(context: PacketContext, fightController: FightController) {
		this.context = context;
		this.fightController = fightController;
	}

	/**
	 * Send the fight intro message
	 * @param fighter
	 * @param opponent
	 * @param response
	 */
	introduceFight(response: DraftBotPacket[], fighter: Fighter, opponent: Fighter): void {
		const fightInitiatorActions = new Array<[string, number]>();
		for (const action of fighter.availableFightActions) {
			fightInitiatorActions.push([action[0], action[1].breath]);
		}
		const fightOpponentActions = new Array<[string, number]>();
		for (const action of opponent.availableFightActions) {
			fightOpponentActions.push([action[0], action[1].breath]);
		}
		response.push(makePacket(CommandFightIntroduceFightersPacket, {
			fightInitiatorKeycloakId: (fighter as PlayerFighter).player.keycloakId,
			fightOpponentKeycloakId: opponent instanceof PlayerFighter ? opponent.player.keycloakId : null,
			fightOpponentMonsterId: opponent instanceof MonsterFighter ? opponent.monster.id : null,
			fightInitiatorActions,
			fightOpponentActions
		}));
	}


	/**
	 *  Summarize current fight status, displaying fighter's stats
	 */
	displayFightStatus(response: DraftBotPacket[]): void {
		const playingFighter = this.fightController.getPlayingFighter();
		const defendingFighter = this.fightController.getDefendingFighter();
		response.push(makePacket(CommandFightStatusPacket, {
			numberOfTurn: this.fightController.turn,
			maxNumberOfTurn: FightConstants.MAX_TURNS,
			fightInitiator: {
				keycloakId: (playingFighter as PlayerFighter).player.keycloakId,
				glory: (playingFighter as PlayerFighter).player.getGloryPoints(),
				stats: {
					power: playingFighter.getFightPoints(),
					attack: playingFighter.getAttack(),
					defense: playingFighter.getDefense(),
					speed: playingFighter.getSpeed(),
					breath: playingFighter.getBreath(),
					maxBreath: playingFighter.getMaxBreath(),
					breathRegen: playingFighter.getRegenBreath()
				}
			},
			fightOpponent: {
				keycloakId: defendingFighter instanceof PlayerFighter ? (defendingFighter as PlayerFighter).player.keycloakId : null,
				monsterId: defendingFighter instanceof MonsterFighter ? (defendingFighter as MonsterFighter).monster.id : null,
				glory: defendingFighter instanceof PlayerFighter ? (defendingFighter as PlayerFighter).player.getGloryPoints() : null,
				stats: {
					power: defendingFighter.getFightPoints(),
					attack: defendingFighter.getAttack(),
					defense: defendingFighter.getDefense(),
					speed: defendingFighter.getSpeed(),
					breath: defendingFighter.getBreath(),
					maxBreath: defendingFighter.getMaxBreath(),
					breathRegen: defendingFighter.getRegenBreath()
				}
			}
		}));
	}

	/**
	 * Update the fight history with the new action made by a fighter (can be an attack or a status alteration)
	 * @param response
	 * @param fighter - the fighter that made the action or received the alteration
	 * @param fightAction - the action made by the fighter
	 * @param fightActionResult - the result of the action
	 */
	addActionToHistory(response: DraftBotPacket[], fighter: Fighter, fightAction: FightAction, fightActionResult: FightActionResult | FightAlterationResult): void {

		const buildStatsChange = (selfTarget: boolean): { attack?: number; defense?: number; speed?: number; breath?: number } => fightActionResult.buffs
			.filter(buff =>
				buff.selfTarget === selfTarget &&
					[FightStatBuffed.ATTACK, FightStatBuffed.DEFENSE, FightStatBuffed.SPEED, FightStatBuffed.BREATH].includes(buff.stat) &&
					buff.operator === FightStatModifierOperation.MULTIPLIER)
			.reduce((acc, buff) => {
				switch (buff.stat) {
				case FightStatBuffed.ATTACK:
					acc.attack = toSignedPercent(buff.value);
					break;
				case FightStatBuffed.DEFENSE:
					acc.defense = toSignedPercent(buff.value);
					break;
				case FightStatBuffed.SPEED:
					acc.speed = toSignedPercent(buff.value);
					break;
				case FightStatBuffed.BREATH:
					acc.breath = buff.value;
					break;
				default:
					break;
				}
				return acc;
			}, {} as { attack?: number; defense?: number; speed?: number; breath?: number });

		response.push(makePacket(CommandFightHistoryItemPacket, {
			fighterKeycloakId: fighter instanceof PlayerFighter ? fighter.player.keycloakId : null,
			monsterId: fighter instanceof MonsterFighter ? fighter.monster.id : null,
			fightActionId: fightAction.id,
			alterationStatus: "state" in fightActionResult ? fightActionResult.state : null, // only for alterations; not for attacks
			status: "attackStatus" in fightActionResult ? fightActionResult.attackStatus : null, // only for attacks; not for alterations
			damageDealt: fightActionResult.damages,
			damageReceived: fightActionResult.buffs.find(
				buff => buff.selfTarget && buff.stat === FightStatBuffed.DAMAGE && buff.operator === FightStatModifierOperation.ADDITION
			)?.value,
			statsChangeDealt: buildStatsChange(false),
			statsChangeReceived: buildStatsChange(true)
		}));
	}

	/**
	 * Get send the fight outro message
	 * @param loser
	 * @param winner
	 * @param draw
	 */
	outroFight(loser: Fighter, winner: Fighter, draw: boolean): void {
		/* if (this.lastSummary) {
			setTimeout(() => this.lastSummary.delete(), TIMEOUT_FUNCTIONS.OUTRO_FIGHT);
		}
		let msg;
		if (!draw) {
			msg = this.fightTranslationModule.format("end.win", {
				winner: winner.getMention(),
				loser: loser.getMention()
			});
		}
		else {
			msg = this.fightTranslationModule.format("end.draw", {
				player1: winner.getMention(),
				player2: loser.getMention()
			});
		}
		msg += this.fightTranslationModule.format("end.gameStats", {
			turn: this.fightController.turn,
			maxTurn: FightConstants.MAX_TURNS,
			time: minutesDisplay(millisecondsToMinutes(new Date().valueOf() - this.fightLaunchMessage.createdTimestamp))
		});

		for (const fighter of [winner, loser]) {
			msg += this.fightTranslationModule.format("end.fighterStats", {
				pseudo: fighter.getName(),
				health: fighter.getFightPoints(),
				maxHealth: fighter.getMaxFightPoints()
			});
		}

		this.channel.send({embeds: [new DraftBotEmbed().setDescription(msg)]})
			.then(message => message.react(FightConstants.HANDSHAKE_EMOTE)); */
	}

	/**
	 * Send a message to the channel to display the status of the fight when a bug is detected
	 */
	displayBugFight(): void {
		/* this.channel.send({
			embeds: [
				new DraftBotEmbed()
					.setErrorColor()
					.setTitle(this.fightTranslationModule.get("bugFightTitle"))
					.setDescription(this.fightTranslationModule.get("bugFightDescription"))]
		}); */
	}

	/**
	 * Get summarize embed message
	 * @param {Fighter} attacker
	 * @param {Fighter} defender
	 * @return
	 */

	private getSummarizeEmbed(attacker: Fighter, defender: Fighter): void { // DraftBotEmbed {
		/* return new DraftBotEmbed()
			.setTitle(this.fightTranslationModule.get("summarize.title"))
			.setDescription(`${this.fightTranslationModule.format("summarize.intro", {
				turn: this.fightController.turn,
				maxTurns: FightConstants.MAX_TURNS
			}) +
			attacker.getStringDisplay(this.fightTranslationModule)}\n\n${defender.getStringDisplay(this.fightTranslationModule)}`); */
	}


	/**
	 * Scroll the messages down if needed before fight display status
	 * @return {Promise<void>}
	 */
	private async scrollIfNeeded(): Promise<void> {
		/* const messages = await this.channel.messages.fetch({limit: 1});
		if (this.lastSummary && messages.first().createdTimestamp !== this.lastSummary.createdTimestamp) {
			for (const actionMessage of this.actionMessages) {
				const content = (await this.channel.messages.fetch(actionMessage.id)).content;
				await actionMessage.edit(content);
			}
			await this.lastSummary.delete();
			this.lastSummary = null;
		} */
	}
}

/* eslint-enable */
