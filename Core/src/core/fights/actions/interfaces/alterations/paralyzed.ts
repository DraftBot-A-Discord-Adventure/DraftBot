import { FightStatModifierOperation } from "../../../../../../../Lib/src/types/FightStatModifierOperation";
import { FightAlterationFunc } from "../../../../../data/FightAlteration";
import { FightActionDataController } from "../../../../../data/FightAction";
import { FightAlterationState } from "../../../../../../../Lib/src/types/FightAlterationResult";
import { FightStatBuffed } from "../../../../../../../Lib/src/types/FightActionResult";
import { FightActionController } from "../../FightActionController";
import {
	defaultFightAlterationResult, defaultHealFightAlterationResult
} from "../../../FightController";

const use: FightAlterationFunc = (affected, fightAlteration) => {
	if (affected.alterationTurn > 2) { // This effect heals after two turns
		affected.removeSpeedModifiers(fightAlteration);
		return defaultHealFightAlterationResult(affected);
	}

	// 20% chance of not being able to attack this turn
	if (Math.random() < 0.2) {
		affected.nextFightAction = FightActionDataController.instance.getNone();
		return {
			state: FightAlterationState.NO_ACTION
		};
	}

	const result = defaultFightAlterationResult();
	if (!affected.hasSpeedModifier(fightAlteration)) {
		result.state = FightAlterationState.NEW;
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.SPEED,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 0
		}, affected, fightAlteration);
	}
	return result;
};

export default use;
