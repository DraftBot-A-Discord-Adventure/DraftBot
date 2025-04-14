import { FightAlterationFunc } from "../../../../../data/FightAlteration";
import { FightStatModifierOperation } from "../../../../../../../Lib/src/types/FightStatModifierOperation";
import { FightAlterationState } from "../../../../../../../Lib/src/types/FightAlterationResult";
import { FightActionController } from "../../FightActionController";
import { FightStatBuffed } from "../../../../../../../Lib/src/types/FightActionResult";
import {
	defaultFightAlterationResult, defaultHealFightAlterationResult
} from "../../../FightController";

const use: FightAlterationFunc = (affected, fightAlteration) => {
	if (affected.alterationTurn > 2) { // This effect heals after two turns
		affected.removeDefenseModifiers(fightAlteration);
		return defaultHealFightAlterationResult(affected);
	}

	const result = defaultFightAlterationResult();

	if (!affected.hasDefenseModifier(fightAlteration)) {
		result.state = FightAlterationState.NEW;
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.DEFENSE,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 1.3
		}, affected, fightAlteration);
	}
	return result;
};

export default use;
