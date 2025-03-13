import {FightActionController} from "../../FightActionController";
import {FightAlterationFunc} from "../../../../../data/FightAlteration";
import {
	defaultFightAlterationResult,
	defaultHealFightAlterationResult
} from "../../../FightController";
import {FightAlterationState} from "../../../../../../../Lib/src/types/FightAlterationResult";
import {FightStatBuffed} from "../../../../../../../Lib/src/types/FightActionResult";
import {FightStatModifierOperation} from "../../../../../../../Lib/src/types/FightStatModifierOperation";

const use: FightAlterationFunc = (affected, fightAlteration, _opponent) => {
	// 20 % chance to be healed from being dirty (except for the first three turns)
	if (Math.random() < 0.2 && affected.alterationTurn > 3) {
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
			value: 1.05
		}, affected, fightAlteration);
	}
	return result;
};

export default use;
