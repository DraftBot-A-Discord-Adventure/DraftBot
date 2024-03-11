import {FightConstants} from "../../../../../../../Lib/src/constants/FightConstants";
import {FightActionDataController, FightActionFunc} from "../../../../../data/FightAction";
import {defaultFailFightActionResult, defaultFightActionResult} from "../../../../../../../Lib/src/interfaces/FightActionResult";

const use: FightActionFunc = (sender, receiver, _fightAction, turn, fight) => {
	const lastAttack = receiver.getLastFightActionUsed();
	if (FightConstants.UNCOUNTERABLE_ACTIONS.includes(lastAttack.id)) {
		return defaultFailFightActionResult();
	}

	const launchedResult = FightActionDataController.getFightActionFunction(lastAttack.id)(sender, receiver, lastAttack, turn, fight);
	const result = defaultFightActionResult();
	result.usedAction = {
		id: lastAttack.id,
		result: launchedResult,
		fromFighter: "player"
	};
	return result;
};

export default use;