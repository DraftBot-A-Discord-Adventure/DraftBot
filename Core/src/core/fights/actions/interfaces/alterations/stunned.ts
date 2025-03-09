import {FightAlterationFunc} from "../../../../../data/FightAlteration";
import {FightAlterationState} from "../../../../../../../Lib/src/types/FightAlterationResult";
import {FightActionDataController} from "../../../../../data/FightAction";
import {defaultFightAlterationResult, defaultHealFightAlterationResult} from "../../../FightController";

const use: FightAlterationFunc = (affected) => {
	if (affected.alterationTurn > 1) { // This effect heals after one turn
		return defaultHealFightAlterationResult(affected);
	}

	const result = defaultFightAlterationResult();

	// 50% chance of not being able to attack this turn
	if (Math.random() < 0.5) {
		affected.nextFightAction = FightActionDataController.instance.getNone();
		result.state = FightAlterationState.NO_ACTION;
	}
	return result;
};

export default use;