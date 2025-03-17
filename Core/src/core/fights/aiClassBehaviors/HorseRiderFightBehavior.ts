import {ClassBehavior} from "../AiBehaviorManager";
import {AiPlayerFighter} from "../fighter/AiPlayerFighter";
import {FightView} from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";
import {simpleOrQuickAttack} from "./EsquireFightBehavior";

class HorseRiderFightBehavior implements ClassBehavior {
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
		if (me.getEnergy() < 125 && opponent.getEnergy() > 400) {
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

		// Heavy attacks if the opponent has more defense and we have enough breath
		if (opponent.getDefense() > me.getDefense() && me.getBreath() >= 7) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.HEAVY_ATTACK);
		}

		return simpleOrQuickAttack(me, opponent, restCount);
	}
}

export default HorseRiderFightBehavior;