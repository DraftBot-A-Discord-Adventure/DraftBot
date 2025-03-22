import { ClassBehavior } from "../AiBehaviorManager";
import { AiPlayerFighter } from "../fighter/AiPlayerFighter";
import { FightView } from "../FightView";
import { FightAction, FightActionDataController } from "../../../data/FightAction";
import { FightConstants } from "../../../../../Lib/src/constants/FightConstants";
import { shouldContinueCanonSequence, shouldStartCanonSequence, shouldUseBoomerang } from "./RockThrowerFightBehavior";
import { shouldUseSabotage } from "./SlingerFightBehavior";
import { Fighter } from "../fighter/Fighter";
import { RandomUtils } from "../../../../../Lib/src/utils/RandomUtils";
import Player from "../../database/game/models/Player";
import { PlayerFighter } from "../fighter/PlayerFighter";
import { ClassConstants } from "../../../../../Lib/src/constants/ClassConstants";

class TankFightBehavior implements ClassBehavior {

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {
		const opponent = fightView.fightController.getDefendingFighter() as AiPlayerFighter | PlayerFighter;
		const turn = fightView.fightController.turn;

		if (
			(me.getDefense() < 600
				|| RandomUtils.draftbotRandom.bool(0.1))
			&& turn < 3
			&& ![
				ClassConstants.CLASSES_ID.KNIGHT,
				ClassConstants.CLASSES_ID.VALIANT_KNIGHT,
				ClassConstants.CLASSES_ID.PIKEMAN,
				ClassConstants.CLASSES_ID.ESQUIRE,
				ClassConstants.CLASSES_ID.HORSE_RIDER
			].includes(opponent.player.class)
		){
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.DEFENSE_BUFF);
		}

		if (
			(me.getDefense() < 600
				|| RandomUtils.draftbotRandom.bool(0.1))
			&& turn < 3
			&& ![
				ClassConstants.CLASSES_ID.KNIGHT,
				ClassConstants.CLASSES_ID.VALIANT_KNIGHT,
				ClassConstants.CLASSES_ID.PIKEMAN,
				ClassConstants.CLASSES_ID.ESQUIRE,
				ClassConstants.CLASSES_ID.HORSE_RIDER
			].includes(opponent.player.class)
		){
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.DEFENSE_BUFF);
		}

		// Any other case, use a simple attack
		return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.SIMPLE_ATTACK)
	}
}

export default TankFightBehavior;