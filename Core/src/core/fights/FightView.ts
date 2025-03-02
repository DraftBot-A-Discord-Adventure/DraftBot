import {FightController} from "./FightController";
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
import {CommandFightEndOfFightPacket} from "../../../../Lib/src/packets/fights/EndOfFightPacket";
import {BuggedFightPacket} from "../../../../Lib/src/packets/fights/BuggedFightPacket";

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
					...buildStatsChange(false),
					newAlteration: "alterations" in fightActionResult && fightActionResult.alterations?.find(alt => !alt.selfTarget)?.alteration || null,
					damages: fightActionResult.damages
				}
			,
			fightActionEffectReceived:
				{
					...buildStatsChange(true),
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
	 * Generate packets to display the end of the fight
	 * @param response
	 * @param loser
	 * @param winner
	 * @param draw
	 */
	outroFight(
		response: DraftBotPacket[],
		loser: PlayerFighter | MonsterFighter | AiPlayerFighter,
		winner: PlayerFighter | MonsterFighter | AiPlayerFighter,
		draw: boolean
	): void {
		response.push(makePacket(CommandFightEndOfFightPacket, {
			winner: {
				keycloakId: winner instanceof MonsterFighter ? null : winner.player.keycloakId,
				monsterId: winner instanceof MonsterFighter ? winner.monster.id : null,
				finalEnergy: winner.getEnergy(),
				maxEnergy: winner.getMaxEnergy()
			},
			looser: {
				keycloakId: loser instanceof MonsterFighter ? null : loser.player.keycloakId,
				monsterId: loser instanceof MonsterFighter ? loser.monster.id : null,
				finalEnergy: loser.getEnergy(),
				maxEnergy: loser.getMaxEnergy()
			},
			draw,
			turns: this.fightController.turn,
			maxTurns: FightConstants.MAX_TURNS
		}));
	}

	/**
	 * Send a bugged end-of-fight packet
	 * @param response
	 */
	displayBugFight(response: DraftBotPacket[]): void {
		response.push(makePacket(BuggedFightPacket, {}));
	}

	sendResponses(response: DraftBotPacket[]): void {
		PacketUtils.sendPackets(this.context, response);
		response.length = 0;
	}
}

/* eslint-enable */
