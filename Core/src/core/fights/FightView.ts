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
import {EndCallback, ReactionCollectorInstance} from "../utils/ReactionsCollector";
import {
	ReactionCollectorFightChooseAction,
	ReactionCollectorFightChooseActionReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorFightChooseAction";
import {AIFightActionChoosePacket} from "../../../../Lib/src/packets/fights/AIFightActionChoosePacket";
import {PacketUtils} from "../utils/PacketUtils";
import {AiPlayerFighter} from "./fighter/AiPlayerFighter";

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
	introduceFight(response: DraftBotPacket[], fighter: PlayerFighter, opponent: MonsterFighter | AiPlayerFighter): void {
		const fightInitiatorActions = new Array<[string, number]>();
		for (const action of fighter.availableFightActions) {
			fightInitiatorActions.push([action[0], action[1].breath]);
		}
		const fightOpponentActions = new Array<[string, number]>();
		for (const action of opponent.availableFightActions) {
			fightOpponentActions.push([action[0], action[1].breath]);
		}
		response.push(makePacket(CommandFightIntroduceFightersPacket, {
			fightInitiatorKeycloakId: fighter.player.keycloakId,
			fightOpponentKeycloakId: opponent instanceof MonsterFighter ? null : opponent.player.keycloakId,
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
			activeFighter: {
				keycloakId: playingFighter instanceof MonsterFighter ? null : playingFighter.player.keycloakId,
				monsterId: playingFighter instanceof MonsterFighter ? playingFighter.monster.id : null,
				glory: playingFighter instanceof MonsterFighter ? null : playingFighter.player.getGloryPoints(),
				stats: {
					power: playingFighter.getEnergy(),
					attack: playingFighter.getAttack(),
					defense: playingFighter.getDefense(),
					speed: playingFighter.getSpeed(),
					breath: playingFighter.getBreath(),
					maxBreath: playingFighter.getMaxBreath(),
					breathRegen: playingFighter.getRegenBreath()
				}
			},
			defendingFighter: {
				keycloakId: defendingFighter instanceof MonsterFighter ? null : defendingFighter.player.keycloakId,
				monsterId: defendingFighter instanceof MonsterFighter ? defendingFighter.monster.id : null,
				glory: defendingFighter instanceof MonsterFighter ? null : defendingFighter.player.getGloryPoints(),
				stats: {
					power: defendingFighter.getEnergy(),
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
	addActionToHistory(
		response: DraftBotPacket[],
		fighter: PlayerFighter | MonsterFighter | AiPlayerFighter,
		fightAction: FightAction,
		fightActionResult: FightActionResult | FightAlterationResult
	): void {

		const buildStatsChange = (selfTarget: boolean): {
			attack?: number;
			defense?: number;
			speed?: number;
			breath?: number;
			energy?: number;
		} => fightActionResult.buffs
			?.filter(buff =>
				buff.selfTarget === selfTarget
				&& ([FightStatBuffed.ATTACK, FightStatBuffed.DEFENSE, FightStatBuffed.SPEED, FightStatBuffed.BREATH].includes(buff.stat)
					&& buff.operator === FightStatModifierOperation.MULTIPLIER
					|| [FightStatBuffed.ENERGY].includes(buff.stat)
					&& buff.operator === FightStatModifierOperation.ADDITION))
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
				case FightStatBuffed.ENERGY:
					acc.energy = buff.value;
					break;
				default:
					break;
				}
				return acc;
			}, {} as { attack?: number; defense?: number; speed?: number; breath?: number; energy?: number });

		response.push(makePacket(CommandFightHistoryItemPacket, {
			fighterKeycloakId: fighter instanceof MonsterFighter ? null : fighter.player.keycloakId,
			monsterId: fighter instanceof MonsterFighter ? fighter.monster.id : null,
			/* Sometimes fightActionResult.usedAction is not the same
				as what the user selected (fightAction is what the user selected)
	            and fightActionResult.usedAction is what ended up being used */
			fightActionId: Object.prototype.hasOwnProperty.call(fightActionResult, "usedAction") ? (fightActionResult as FightActionResult).usedAction.id : fightAction.id,
			customMessage: "customMessage" in fightActionResult ? fightActionResult.customMessage : false,
			status:
				"attackStatus" in fightActionResult ?
					fightActionResult.attackStatus : // FightAction is an attack, so we have an attackStatus
					"state" in fightActionResult ?
						fightActionResult.state : // FightAction is an alteration, so we have a state
						null, // FightAction is neither an attack nor an alteration (should not happen)
			fightActionEffectDealt:
				{
					...
					buildStatsChange(false),
					newAlteration: "alterations" in fightActionResult && fightActionResult.alterations?.find(alt => !alt.selfTarget)?.alteration || null,
					damages: fightActionResult.damages
				}
			,
			fightActionEffectReceived: {
				...
				buildStatsChange(true),
				newAlteration: "alterations" in fightActionResult && fightActionResult.alterations?.find(alt => alt.selfTarget)?.alteration || null,
				damages:
				fightActionResult.buffs?.find(
					buff => buff.selfTarget && buff.stat === FightStatBuffed.DAMAGE && buff.operator === FightStatModifierOperation.ADDITION
				)?.value
			}
		}))
		;
	}

	/**
	 * Display the fight action menu
	 * @param response
	 * @param playerFighter - the player fighter - This cannot be a monster: they do not use a front-end to play draftbot :p
	 * @param actions - the actions available for the player
	 */
	displayFightActionMenu(response: DraftBotPacket[], playerFighter: PlayerFighter, actions: Map<string, FightAction>): void {
		const collector = new ReactionCollectorFightChooseAction(playerFighter.player.keycloakId, [...actions.keys()]);

		const endCallback: EndCallback = async (collector, response) => {
			const reaction = collector.getFirstReaction();
			if (!reaction) {
				playerFighter.kill();
				await this.fightController.endFight(response);
			}
			else {
				await this.fightController.executeFightAction(actions.get((reaction.reaction.data as ReactionCollectorFightChooseActionReaction).id)!, true, response);
			}
		};

		const packet = new ReactionCollectorInstance(
			collector,
			this.context,
			{
				allowedPlayerKeycloakIds: [playerFighter.player.keycloakId]
			},
			endCallback
		)
			.build();

		response.push(packet);
	}

	/**
	 * Display the AI choose action message
	 * @param response
	 */
	displayAiChooseAction(response: DraftBotPacket[]): void {
		response.push(makePacket(AIFightActionChoosePacket, {}));
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

	sendResponses(response: DraftBotPacket[]): void {
		PacketUtils.sendPackets(this.context, response);
		response.length = 0;
	}
}

/* eslint-enable */
