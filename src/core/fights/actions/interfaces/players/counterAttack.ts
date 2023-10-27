import {FightConstants} from "../../../../constants/FightConstants";
import {FightActionDataController, FightActionFunc} from "@Core/src/data/FightAction";
import {defaultFailFightActionResult, defaultFightActionResult} from "@Lib/src/interfaces/FightActionResult";

const use: FightActionFunc = (fight, _fightAction, sender, receiver, turn) => {
	const lastAttack = receiver.getLastFightActionUsed();
	if (FightConstants.UNCOUNTERABLE_ACTIONS.includes(lastAttack.id)) {
		return defaultFailFightActionResult();
	}

	const launchedResult = FightActionDataController.getFightActionFunction(lastAttack.id)(fight, lastAttack, sender, receiver, turn);
	const result = defaultFightActionResult();
	result.usedAction = {
		id: lastAttack.id,
		result: launchedResult,
		fromFighter: "player"
	};
	return result;
};

export default use;