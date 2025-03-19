import {ClassBehavior} from "../AiBehaviorManager";
import {AiPlayerFighter} from "../fighter/AiPlayerFighter";
import {FightView} from "../FightView";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {FightConstants} from "../../../../../Lib/src/constants/FightConstants";
import {PlayerFighter} from "../fighter/PlayerFighter";
import {ClassConstants} from "../../../../../Lib/src/constants/ClassConstants";
import {RandomUtils} from "../../../../../Lib/src/utils/RandomUtils";
import {piercingOrSimpleAttack, shouldProtect} from "./RecruitFightBehavior";

class VeteranFightBehavior implements ClassBehavior {

	chooseAction(me: AiPlayerFighter, fightView: FightView): FightAction {

		const opponent = fightView.fightController.getDefendingFighter() as PlayerFighter | AiPlayerFighter; // AI will never fight monsters

		if () {
			return FightActionDataController.instance.getById(FightConstants.FIGHT_ACTIONS.PLAYER.CONCENTRATION);
		}

	}
}

export default VeteranFightBehavior;