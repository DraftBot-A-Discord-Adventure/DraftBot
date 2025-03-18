import { ClassBehavior } from "../AiBehaviorManager";
import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import { FightAction, FightActionDataController } from "../../../data/FightAction";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import {Fighter} from "../fighter/Fighter";

/**
 * Determines whether the AI should use a boomerang attack
 * @param opponent - The opponent fighter in the current battle
 * @param me - The AI fighter making the action decision
 * @param isGoingForChainedCanonAttack - Whether the AI is currently executing a chained canon attack strategy
 * @returns True if boomerang attack should be used, false otherwise
 */
export function shouldUseBoomerang(
	opponent: Fighter,
	me: AiPlayerFighter,
	isGoingForChainedCanonAttack: boolean
): boolean {
	return !opponent.hasFightAlteration()
		&& !isGoingForChainedCanonAttack
		&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.BOOMERANG_ATTACK);
}

/**
 * Determines whether the AI should start a canon attack sequence
 * @param opponent - The opponent fighter in the current battle
 * @param me - The AI fighter making the action decision
 * @param canonAttackUsed - Number of canon attacks already used
 * @param isGoingForChainedCanonAttack - Whether the AI is currently executing a chained canon attack strategy
 * @returns True if fighter should start a canon attack sequence, false otherwise
 */
export function shouldStartCanonSequence(
	opponent: Fighter,
	me: AiPlayerFighter,
	canonAttackUsed: number,
	isGoingForChainedCanonAttack: boolean
): boolean {
	return !isGoingForChainedCanonAttack
		&& canonAttackUsed === 0
		&& opponent.getEnergy() > 400
		&& opponent.hasFightAlteration()
		// Need enough breath for at least two consecutive canon attacks
		&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK) + 2;
}

/**
 * Determines if the AI should continue a chained canon attack sequence
 * @param me - The AI fighter making the action decision
 * @param isGoingForChainedCanonAttack - Whether the AI is currently executing a chained canon attack strategy
 * @param canonAttackUsed - Number of canon attacks already used
 * @param turn - Current turn number in the fight
 * @returns True if fighter should continue a canon attack sequence, false otherwise
 */
export function shouldContinueCanonSequence(
	me: AiPlayerFighter,
	isGoingForChainedCanonAttack: boolean,
	canonAttackUsed: number,
	turn: number
): boolean {
	return turn > 2
		&& isGoingForChainedCanonAttack
		&& me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK)
		&& canonAttackUsed <= 2;
}

class RockThrowerFightBehavior implements ClassBehavior {

	private isGoingForChainedCanonAttack = false;

	private canonAttackUsed = 0;

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter();
		const turn = fightView.fightController.turn;

		// Continue a canon attack sequence if appropriate
		if (shouldContinueCanonSequence(me, this.isGoingForChainedCanonAttack, this.canonAttackUsed, turn)) {
			this.canonAttackUsed++;
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK);
		}

		// Clear the chained canon attack flag if 3 canon attacks have been used or not enough breath for the third
		if (
			this.isGoingForChainedCanonAttack
			&& (this.canonAttackUsed >= 3
				|| me.getBreath() < FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK)
				&& this.canonAttackUsed === 2)
		) {
			this.isGoingForChainedCanonAttack = false;
		}

		// If opponent is very low health, finish them with any attack
		if (opponent.getEnergy() <= opponent.getMaxEnergy() * 0.06) {
			// Quick Attack is good for finishing off enemies if we have enough breath
			if (me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK)) {
				return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK);
			}

			// Otherwise use canon attack as fallback
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK);
		}

		// Play boomerang when possible if the opponent has no alteration
		if (shouldUseBoomerang(opponent, me, this.isGoingForChainedCanonAttack)) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.BOOMERANG_ATTACK);
		}

		// Start a canon attack sequence if appropriate
		if (shouldStartCanonSequence(opponent, me, this.canonAttackUsed, this.isGoingForChainedCanonAttack)) {
			this.isGoingForChainedCanonAttack = true;
			this.canonAttackUsed++;
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK);
		}

		// Quick attack when we have enough breath
		if (me.getBreath() >= FightActionDataController.getFightActionBreathCost(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK)) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK);
		}

		// Canon attack as fallback
		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CANON_ATTACK);
	}
}

export default RockThrowerFightBehavior;