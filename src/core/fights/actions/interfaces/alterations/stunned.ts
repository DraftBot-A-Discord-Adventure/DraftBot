import {FightAlterationFunc} from "@Core/src/data/FightAlteration";
import {defaultFightAlterationResult, defaultHealFightAlterationResult, FightAlterationState} from "@Lib/src/interfaces/FightAlterationResult";
import {FightActionDataController} from "@Core/src/data/FightAction";

const use: FightAlterationFunc = (affected) => {
	if (affected.alterationTurn > 1) { // This effect heals after one turn
		return defaultHealFightAlterationResult(affected);
	}

	const result = defaultFightAlterationResult();

	// 50% chance to not attack this turn
	if (Math.random() < 0.5) {
		affected.nextFightAction = FightActionDataController.instance.getNone();
		result.state = FightAlterationState.NO_ACTION;
	}
	return result;
};

export default use;