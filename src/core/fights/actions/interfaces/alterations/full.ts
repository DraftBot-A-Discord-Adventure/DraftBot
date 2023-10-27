import {FightAlterationFunc} from "@Core/src/data/FightAlteration";
import {defaultFightAlterationResult, defaultHealFightAlterationResult, FightAlterationState} from "@Lib/src/interfaces/FightAlterationResult";
import {FightActionDataController} from "@Core/src/data/FightAction";
import {FightActionController} from "@Core/src/core/fights/actions/FightActionController";
import {FightStatBuffed} from "@Lib/src/interfaces/FightActionResult";
import {FightStatModifierOperation} from "@Lib/src/interfaces/FightStatModifierOperation";

const use: FightAlterationFunc = (affected, fightAlteration) => {
	if (affected.alterationTurn > 2) { // This effect heals after two turns
		return defaultHealFightAlterationResult(affected);
	}

	affected.nextFightAction = FightActionDataController.instance.getNone();

	const result = defaultFightAlterationResult();

	if (!affected.hasSpeedModifier(fightAlteration)) {
		FightActionController.applyBuff(result, {
			selfTarget: true,
			stat: FightStatBuffed.SPEED,
			operator: FightStatModifierOperation.MULTIPLIER,
			value: 0
		}, affected, fightAlteration);
		result.state = FightAlterationState.NEW;
	}

	return result;
};

export default use;