import { ClassBehavior } from "../AiBehaviorManager";
import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import { FightAction, FightActionDataController } from "../../../data/FightAction";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import { PlayerFighter } from "../fighter/PlayerFighter";
import { MonsterFighter } from "../fighter/MonsterFighter";

class EsquireFightBehavior implements ClassBehavior {
	// WeakMap to store fighter-specific rest counts
	private restCountMap = new WeakMap<AiPlayerFighter, number>();

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter();
		const currentRound = fightView.fightController.turn;

		// Get fighter-specific rest count or initialize to 0 if not set
		let restCount = this.restCountMap.get(me) || 0;

		// Initialize defense tracking on first round
		if (currentRound <= 1) {
			restCount = 0; // Reset rest counter at the beginning of a fight
			this.restCountMap.set(me, restCount);
		}

		// ENDGAME STRATEGY: Try to force a draw if victory seems impossible
		// Still rest even if we've done it 4 times, because the goal is to stall
		if (me.getEnergy() < 75 && opponent.getEnergy() > 200) {
			restCount++;
			this.restCountMap.set(me, restCount);
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.RESTING);
		}

		// REST WHEN NEEDED: Not enough breath for actions (only if we haven't rested 4 times)
		if (me.getBreath() < 2 && restCount < 4) {
			restCount++;
			this.restCountMap.set(me, restCount);
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.RESTING);
		}

		return simpleOrQuickAttack(me, opponent, restCount);
	}
}

/**
 * Choose between a simple or quick attack based on speed comparison and breath
 * @param me
 * @param opponent
 * @param restCount Optional rest count for decision-making
 */
export function simpleOrQuickAttack(
	me: AiPlayerFighter,
	opponent: PlayerFighter | MonsterFighter | AiPlayerFighter,
	restCount?: number
): FightAction {
	// Other attacks based on speed comparison
	const mySpeed = me.getSpeed();
	const opponentSpeed = opponent.getSpeed();

	// If my speed is greater than the opponent's speed, use a quick attack otherwise, use a simple attack
	// If we're very low on breath but have already rested 4 times, still try to attack
	if (mySpeed > opponentSpeed && (me.getBreath() >= 3 || restCount !== undefined && restCount >= 4)) {
		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK);
	}
	return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SIMPLE_ATTACK);
}

export default EsquireFightBehavior;