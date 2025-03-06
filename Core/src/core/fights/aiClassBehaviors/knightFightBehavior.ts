import {ClassBehavior, registerClassBehavior} from "../AiBehaviorManager";
import {AiPlayerFighter} from "../fighter/AiPlayerFighter";
import {FightView} from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {ClassConstants} from "../../../../../Lib/src/constants/ClassConstants";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";

class KnightFightBehavior implements ClassBehavior {
	chooseAction(_fighter: AiPlayerFighter, fightView: FightView): FightAction {
		const fighter = fightView.fightController.getPlayingFighter();
		const opponent = fightView.fightController.getDefendingFighter();

		const currentRound = fightView.fightController.turn;
		const maxRounds = FightConstants.MAX_TURNS;
		const isEndgameApproaching = currentRound >= maxRounds - 3;

		// Check if we need to rest to recover breath
		if (fighter.getBreath() < 3) {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.RESTING);
		}

	}
}

// Register this behavior for both Knight classes
registerClassBehavior(ClassConstants.CLASSES_ID.KNIGHT, new KnightFightBehavior());
registerClassBehavior(ClassConstants.CLASSES_ID.VALIANT_KNIGHT, new KnightFightBehavior());