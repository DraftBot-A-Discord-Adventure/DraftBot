import { ClassBehavior } from "../AiBehaviorManager";
import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import { FightAction, FightActionDataController } from "../../../data/FightAction";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import { RandomUtils } from "../../../../../Lib/src/utils/RandomUtils";
import {getUsedGodMoves} from "../actions/interfaces/players/divineAttack";

class KnightFightBehavior implements ClassBehavior {
	private blessRoundChosen: number | null = null;

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter();
		const currentRound = fightView.fightController.turn;

		// Initialize defense tracking on first round
		if (currentRound <= 1) {
			this.blessRoundChosen = RandomUtils.randInt(10, 14); // Choose when to use benediction
		}

		// ENDGAME STRATEGY: Try to force a draw if victory seems impossible
		if (me.getEnergy() < 150 && opponent.getEnergy() > 500) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.RESTING);
		}

		// BENEDICTION STRATEGY: Use benediction at the chosen round
		if (getUsedGodMoves(me,opponent) < 1 && currentRound === this.blessRoundChosen || currentRound === this.blessRoundChosen + 1) {
			// Not enough breath for benediction? Rest first
			if (me.getBreath() < 8) {
				this.blessRoundChosen += 2;
				return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.RESTING);
			}

			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.BENEDICTION);
		}

		// REST WHEN NEEDED: Not enough breath for actions
		if (me.getBreath() < 2) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.RESTING);
		}

		// Heavy attacks if the opponent has more defense and we have enough breath
		if (opponent.getDefense() > me.getDefense() && me.getBreath() >= 7) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.HEAVY_ATTACK);
		}

		// Other attacks based on speed comparison
		const mySpeed = me.getSpeed();
		const opponentSpeed = opponent.getSpeed();

		// If my speed is greater than the opponent's speed, use a quick attack otherwise, use a simple attack
		if (mySpeed > opponentSpeed && me.getBreath() >= 3) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.QUICK_ATTACK);
		}
		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SIMPLE_ATTACK);
	}
}

export default KnightFightBehavior;