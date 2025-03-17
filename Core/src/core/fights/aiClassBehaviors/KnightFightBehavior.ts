import { ClassBehavior } from "../AiBehaviorManager";
import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import { FightAction, FightActionDataController } from "../../../data/FightAction";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import { RandomUtils } from "../../../../../Lib/src/utils/RandomUtils";
import {getUsedGodMoves} from "../FightController";
import {simpleOrQuickAttack} from "./EsquireFightBehavior";

class KnightFightBehavior implements ClassBehavior {
	// WeakMaps to store fighter-specific state
	private blessRoundChosenMap = new WeakMap<AiPlayerFighter, number>();

	private restCountMap = new WeakMap<AiPlayerFighter, number>();

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter();
		const currentRound = fightView.fightController.turn;

		// Get a fighter-specific state or initialize if it doesn't exist
		let blessRoundChosen = this.blessRoundChosenMap.get(me);
		let restCount = this.restCountMap.get(me) || 0;

		// Initialize defense tracking on first round
		if (currentRound <= 1) {
			blessRoundChosen = RandomUtils.randInt(8, 14); // Choose when to use benediction
			this.blessRoundChosenMap.set(me, blessRoundChosen);
			restCount = 0; // Reset rest counter at the beginning of a fight
			this.restCountMap.set(me, restCount);
		}

		// ENDGAME STRATEGY: Try to force a draw if victory seems impossible
		// Still rest even if we've done it 4 times, because the goal is to stall
		if (me.getEnergy() < 150 && opponent.getEnergy() > 500) {
			restCount++;
			this.restCountMap.set(me, restCount);
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.RESTING);
		}

		// BENEDICTION STRATEGY: Use benediction at the chosen round
		if (getUsedGodMoves(me, opponent) < 1 && blessRoundChosen && (currentRound === blessRoundChosen || currentRound === blessRoundChosen + 1)) {
			// Not enough breath for benediction? Rest first (only if we haven't rested 4 times)
			if (me.getBreath() < 8) {
				if (restCount < 4) {
					this.blessRoundChosenMap.set(me, blessRoundChosen + 2);
					restCount++;
					this.restCountMap.set(me, restCount);
					return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.RESTING);
				}
				// Otherwise, delay benediction but don't rest
				this.blessRoundChosenMap.set(me, blessRoundChosen + 1);
			}

			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.BENEDICTION);
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

export default KnightFightBehavior;