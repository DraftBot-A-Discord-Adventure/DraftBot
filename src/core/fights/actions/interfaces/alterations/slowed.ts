import {FightAlterationFunc} from "@Core/src/data/FightAlteration";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";
import {FightAlterationState} from "@Lib/src/interfaces/FightAlterationResult";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {defaultFightAlterationResult, defaultHealFightAlterationResult} from "@Core/src/core/fights/FightController";

const use: FightAlterationFunc = (affected, fightAlteration) => {
	if (affected.alterationTurn > 1) { // This effect heals after one turn
		affected.removeSpeedModifiers(fightAlteration);
		return defaultHealFightAlterationResult(affected);
	}

	const result = defaultFightAlterationResult();
	if (!affected.hasSpeedModifier(fightAlteration)) {
		result.state = FightAlterationState.NEW;
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.SPEED,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 0.4
		}, affected, fightAlteration);
	}
	return result;
};

export default use;