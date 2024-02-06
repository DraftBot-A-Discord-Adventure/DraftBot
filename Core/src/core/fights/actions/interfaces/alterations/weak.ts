import {FightAlterationFunc} from "../../../../../data/FightAlteration";
import {FightAlterationState} from "../../../../../../../Lib/src/interfaces/FightAlterationResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/interfaces/FightStatModifierOperation";
import {FightActionController} from "../../FightActionController";
import {FightStatBuffed} from "../../../../../../../Lib/src/interfaces/FightActionResult";
import {defaultFightAlterationResult, defaultHealFightAlterationResult} from "../../../FightController";

const use: FightAlterationFunc = (affected, fightAlteration) => {
	if (affected.alterationTurn > 1) { // This effect heals after one turn
		affected.removeAttackModifiers(fightAlteration);
		return defaultHealFightAlterationResult(affected);
	}

	const result = defaultFightAlterationResult();

	if (!affected.hasAttackModifier(fightAlteration)) {
		result.state = FightAlterationState.NEW;
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.ATTACK,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 0.3
		}, affected, fightAlteration);
	}
	return result;
};

export default use;